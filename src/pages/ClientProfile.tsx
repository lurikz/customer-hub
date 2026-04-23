 import { useState } from "react";
 import { useParams, Link } from "react-router-dom";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { 
   ArrowLeft, 
   Calendar, 
   Clock, 
   Edit, 
   MessageSquare, 
   Plus, 
   User, 
   Building2, 
   MapPin, 
   StickyNote 
 } from "lucide-react";
 import { format, parseISO } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { 
   Dialog, 
   DialogContent, 
   DialogDescription, 
   DialogFooter, 
   DialogHeader, 
   DialogTitle 
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import { toast } from "@/hooks/use-toast";
 import { clientsApi, recordsApi, type ClientRecord } from "@/lib/api";
 import { ClientFormDialog } from "@/components/ClientFormDialog";
 
 function formatDate(value: string | null) {
   if (!value) return "—";
   try {
     return format(parseISO(value), "dd/MM/yyyy", { locale: ptBR });
   } catch {
     return value;
   }
 }
 
 function formatDateTime(value: string) {
   try {
     return format(parseISO(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
   } catch {
     return value;
   }
 }
 
 export default function ClientProfile() {
   const { id } = useParams<{ id: string }>();
   const queryClient = useQueryClient();
   const [recordDialogOpen, setRecordDialogOpen] = useState(false);
   const [editDialogOpen, setEditDialogOpen] = useState(false);
   const [newRecord, setNewRecord] = useState({ description: "", type: "atendimento" });
 
   const { data: client, isLoading: loadingClient, error: clientError } = useQuery({
     queryKey: ["client", id],
     queryFn: () => clientsApi.get(id!),
     enabled: !!id,
   });
 
   const { data: records, isLoading: loadingRecords } = useQuery({
     queryKey: ["client-records", id],
     queryFn: () => recordsApi.list(id!),
     enabled: !!id,
   });
 
   const createRecordMutation = useMutation({
     mutationFn: (data: typeof newRecord) => recordsApi.create(id!, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["client-records", id] });
       setRecordDialogOpen(false);
       setNewRecord({ description: "", type: "atendimento" });
       toast({ title: "Registro adicionado" });
     },
     onError: (e: Error) => {
       toast({ title: "Erro ao adicionar", description: e.message, variant: "destructive" });
     },
   });
 
   if (loadingClient) {
     return (
       <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
         <Skeleton className="h-8 w-48" />
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Skeleton className="h-64 md:col-span-1" />
           <Skeleton className="h-96 md:col-span-2" />
         </div>
       </div>
     );
   }
 
   if (clientError || !client) {
     return (
       <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
         <p className="text-muted-foreground">Cliente não encontrado.</p>
         <Button asChild variant="outline">
           <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
         </Button>
       </div>
     );
   }
 
   return (
     <div className="mx-auto max-w-6xl px-4 py-8 space-y-6 animate-in fade-in duration-500">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
           <Button asChild variant="ghost" size="icon">
             <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
           </Button>
           <div>
             <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
             <p className="text-sm text-muted-foreground">
               {client.company || "Pessoa Física"}
             </p>
           </div>
         </div>
         <Button onClick={() => setEditDialogOpen(true)} variant="outline" className="gap-2">
           <Edit className="h-4 w-4" />
           Editar Cliente
         </Button>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Sidebar: Client Info */}
         <div className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="text-sm font-medium">Informações de Contato</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-start gap-3">
                 <User className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground uppercase font-semibold">Nome</p>
                   <p className="text-sm">{client.name}</p>
                 </div>
               </div>
               {client.company && (
                 <div className="flex items-start gap-3">
                   <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                   <div>
                     <p className="text-xs text-muted-foreground uppercase font-semibold">Empresa</p>
                     <p className="text-sm">{client.company}</p>
                   </div>
                 </div>
               )}
               <div className="flex items-start gap-3">
                 <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground uppercase font-semibold">Nascimento</p>
                   <p className="text-sm">{formatDate(client.birth_date)}</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground uppercase font-semibold">Origem</p>
                   <Badge variant="secondary" className="mt-1 font-normal">
                     {client.source || "Não informada"}
                   </Badge>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground uppercase font-semibold">Cadastrado em</p>
                   <p className="text-sm">{formatDateTime(client.created_at)}</p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           {client.notes && (
             <Card>
               <CardHeader>
                 <CardTitle className="text-sm font-medium flex items-center gap-2">
                   <StickyNote className="h-4 w-4" />
                   Anotações
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-sm whitespace-pre-wrap text-muted-foreground">{client.notes}</p>
               </CardContent>
             </Card>
           )}
         </div>
 
         {/* Main Content: History/Records */}
         <div className="md:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-semibold">Histórico de Atendimento</h2>
             <Button onClick={() => setRecordDialogOpen(true)} size="sm" className="gap-2">
               <Plus className="h-4 w-4" />
               Adicionar Registro
             </Button>
           </div>
 
           <div className="space-y-4">
             {loadingRecords ? (
               Array(3).fill(0).map((_, i) => (
                 <Skeleton key={i} className="h-24 w-full" />
               ))
             ) : records && records.length > 0 ? (
               records.map((record: ClientRecord) => (
                 <Card key={record.id} className="border-l-4 border-l-primary/50">
                   <CardHeader className="py-3 px-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Badge variant="outline" className="capitalize">
                           {record.type || "Geral"}
                         </Badge>
                         <span className="text-xs text-muted-foreground flex items-center gap-1">
                           <Clock className="h-3 w-3" />
                           {formatDateTime(record.created_at)}
                         </span>
                       </div>
                       <span className="text-xs text-muted-foreground">
                         Por: {record.created_by_name || "Sistema"}
                       </span>
                     </div>
                   </CardHeader>
                   <CardContent className="py-3 px-4 pt-0">
                     <p className="text-sm text-foreground whitespace-pre-wrap">{record.description}</p>
                   </CardContent>
                 </Card>
               ))
             ) : (
               <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                 <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                 <p>Nenhum registro encontrado para este cliente.</p>
                 <p className="text-sm">Comece adicionando um novo atendimento ou observação.</p>
               </div>
             )}
           </div>
         </div>
       </div>
 
       {/* Modals */}
       <ClientFormDialog 
         open={editDialogOpen} 
         onOpenChange={setEditDialogOpen} 
         client={client} 
       />
 
       <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Novo Registro</DialogTitle>
             <DialogDescription>
               Adicione uma observação ou detalhe sobre o atendimento deste cliente.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Tipo de Registro</label>
               <Select 
                 value={newRecord.type} 
                 onValueChange={(v) => setNewRecord({ ...newRecord, type: v })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o tipo" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="atendimento">Atendimento</SelectItem>
                   <SelectItem value="venda">Venda</SelectItem>
                   <SelectItem value="suporte">Suporte</SelectItem>
                   <SelectItem value="negociacao">Negociação</SelectItem>
                   <SelectItem value="observacao">Observação</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Descrição</label>
               <Textarea 
                 placeholder="Descreva o que aconteceu..." 
                 value={newRecord.description}
                 onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                 rows={5}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>Cancelar</Button>
             <Button 
               onClick={() => createRecordMutation.mutate(newRecord)}
               disabled={!newRecord.description.trim() || createRecordMutation.isPending}
             >
               {createRecordMutation.isPending ? "Salvando..." : "Salvar Registro"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }