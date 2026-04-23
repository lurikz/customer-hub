 import { useState } from "react";
 import { useParams, Link } from "react-router-dom";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { 
   ArrowLeft, 
   Calendar, 
   Clock, 
    Edit,
    Trash2,
   MessageSquare, 
   Plus, 
   User, 
   Building2, 
    MapPin,
    Share2,
    StickyNote,
    Mail,
    Phone,
    FileText
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
 
  const getWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    // If it's a Brazilian number and doesn't have the country code, add 55
    const formatted = (cleaned.length === 10 || cleaned.length === 11) ? `55${cleaned}` : cleaned;
    return `https://wa.me/${formatted}`;
  };

 export default function ClientProfile() {
   const { id } = useParams<{ id: string }>();
   const queryClient = useQueryClient();
    const [recordDialogOpen, setRecordDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ClientRecord | null>(null);
    const [recordForm, setRecordForm] = useState({ description: "", type: "atendimento" });
 
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
      mutationFn: (data: typeof recordForm) => recordsApi.create(id!, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["client-records", id] });
        setRecordDialogOpen(false);
        setRecordForm({ description: "", type: "atendimento" });
        toast({ title: "Registro adicionado" });
      },
      onError: (e: Error) => {
        toast({ title: "Erro ao adicionar", description: e.message, variant: "destructive" });
      },
    });

    const updateRecordMutation = useMutation({
      mutationFn: (data: typeof recordForm) => recordsApi.update(id!, editingRecord!.id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["client-records", id] });
        setRecordDialogOpen(false);
        setEditingRecord(null);
        setRecordForm({ description: "", type: "atendimento" });
        toast({ title: "Registro atualizado" });
      },
      onError: (e: Error) => {
        toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
      },
    });

    const deleteRecordMutation = useMutation({
      mutationFn: (recordId: string) => recordsApi.remove(id!, recordId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["client-records", id] });
        toast({ title: "Registro excluído" });
      },
      onError: (e: Error) => {
        toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
      },
    });

    const handleAddRecord = () => {
      setEditingRecord(null);
      setRecordForm({ description: "", type: "atendimento" });
      setRecordDialogOpen(true);
    };

    const handleEditRecord = (record: ClientRecord) => {
      setEditingRecord(record);
      setRecordForm({ description: record.description, type: record.type || "atendimento" });
      setRecordDialogOpen(true);
    };

    const handleDeleteRecord = (recordId: string) => {
      if (confirm("Tem certeza que deseja excluir este registro?")) {
        deleteRecordMutation.mutate(recordId);
      }
    };
 
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
                 <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                   <p className="text-sm">{client.email || "Não informado"}</p>
                 </div>
               </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Telefone</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{client.phone || "Não informado"}</p>
                      {client.phone && (
                        <a
                          href={getWhatsAppLink(client.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#25D366] hover:opacity-80 transition-opacity flex items-center"
                          title="Conversar no WhatsApp"
                        >
                          <svg 
                            viewBox="0 0 24 24" 
                            className="h-4 w-4 fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
               <div className="flex items-start gap-3">
                 <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-xs text-muted-foreground uppercase font-semibold">CPF / CNPJ</p>
                   <p className="text-sm">{client.cpf_cnpj || "Não informado"}</p>
                 </div>
               </div>
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
                   <p className="text-xs text-muted-foreground uppercase font-semibold">Endereço</p>
                   <p className="text-sm">{client.address || "Não informado"}</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <Share2 className="h-4 w-4 mt-1 text-muted-foreground" />
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
              <Button onClick={handleAddRecord} size="sm" className="gap-2">
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground mr-2">
                            Por: {record.created_by_name || "Sistema"}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => handleEditRecord(record)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" 
                            onClick={() => handleDeleteRecord(record.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
              <DialogTitle>{editingRecord ? "Editar Registro" : "Novo Registro"}</DialogTitle>
              <DialogDescription>
                {editingRecord 
                  ? "Atualize as informações deste atendimento." 
                  : "Adicione uma observação ou detalhe sobre o atendimento deste cliente."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Registro</label>
                <Select 
                  value={recordForm.type} 
                  onValueChange={(v) => setRecordForm({ ...recordForm, type: v })}
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
                  value={recordForm.description}
                  onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => editingRecord ? updateRecordMutation.mutate(recordForm) : createRecordMutation.mutate(recordForm)}
                disabled={!recordForm.description.trim() || createRecordMutation.isPending || updateRecordMutation.isPending}
              >
                {createRecordMutation.isPending || updateRecordMutation.isPending ? "Salvando..." : "Salvar Registro"}
              </Button>
            </DialogFooter>
           </DialogContent>
       </Dialog>
     </div>
   );
 }