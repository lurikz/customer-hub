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
     FileText,
     CheckCircle2
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
   import { clientsApi, recordsApi, tasksApi, type ClientRecord, type Task } from "@/lib/api";
  import { ClientFormDialog } from "@/components/ClientFormDialog";
   import { TaskFormDialog } from "@/components/TaskFormDialog";
   import { TasksList } from "@/components/TasksList";
  
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
 
 function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
   return (
     <div className="flex items-start gap-4">
       <Icon className="h-5 w-5 mt-1 text-primary/60" />
       <div className="space-y-1">
         <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{label}</p>
          <p className="text-sm font-medium">{value}</p>
       </div>
     </div>
   );
 }
 
 export default function ClientProfile() {
   const { id } = useParams<{ id: string }>();
   const queryClient = useQueryClient();
    const [recordDialogOpen, setRecordDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ClientRecord | null>(null);
    const [recordForm, setRecordForm] = useState({ description: "", type: "atendimento" });
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
 
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

    const { data: tasks, isLoading: loadingTasks } = useQuery({
      queryKey: ["client-tasks", id],
      queryFn: () => tasksApi.listByClient(id!),
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

    const toggleTaskStatusMutation = useMutation({
      mutationFn: (task: Task) => 
        tasksApi.update(task.id, { status: task.status === "pendente" ? "concluído" : "pendente" }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["client-tasks", id] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
      onError: (e: Error) => {
        toast({ title: "Erro ao atualizar tarefa", description: e.message, variant: "destructive" });
      },
    });

    const handleAddTask = () => {
      setEditingTask(null);
      setTaskDialogOpen(true);
    };

    const handleEditTask = (task: Task) => {
      setEditingTask(task);
      setTaskDialogOpen(true);
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
      <div className="space-y-8 pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="rounded-full bg-accent/50 transition-all hover:bg-accent">
              <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <p className="text-sm text-muted-foreground">
                {client.company || "Pessoa Física"} • Perfil do Cliente
              </p>
            </div>
          </div>
          <Button onClick={() => setEditDialogOpen(true)} variant="outline" className="h-11 gap-2 rounded-xl border-border/50 bg-card/50 px-6 backdrop-blur-sm transition-all hover:bg-accent">
            <Edit className="h-4 w-4" />
            Editar Cliente
          </Button>
        </div>
 
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sidebar: Client Info */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
              <CardHeader className="bg-accent/30 py-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <InfoItem icon={User} label="Nome" value={client.name} />
                {client.company && <InfoItem icon={Building2} label="Empresa" value={client.company} />}
                <InfoItem icon={Mail} label="Email" value={client.email || "Não informado"} />
                <InfoItem icon={Phone} label="Telefone" value={client.phone || "Não informado"} />
                <InfoItem icon={FileText} label="CPF / CNPJ" value={client.cpf_cnpj || "Não informado"} />
                <InfoItem icon={Calendar} label="Nascimento" value={formatDate(client.birth_date)} />
                <InfoItem icon={MapPin} label="Endereço" value={client.address || "Não informado"} />
                <div className="flex items-start gap-4">
                  <Share2 className="h-5 w-5 mt-1 text-primary/60" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Origem</p>
                    <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">{client.source || "Não informada"}</Badge>
                  </div>
                </div>
                <InfoItem icon={Clock} label="Cadastrado em" value={formatDateTime(client.created_at)} />
              </CardContent>
            </Card>
 
            {client.notes && (
              <Card className="border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                    <StickyNote className="h-4 w-4" />
                    Anotações
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
 
         {/* Main Content: History/Timeline */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Histórico de Atendimento
              </h2>
              <div className="flex gap-2">
                <Button onClick={handleAddTask} size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tarefa
                </Button>
                <Button onClick={handleAddRecord} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Registro
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {loadingRecords || loadingTasks ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))
              ) : (
                (() => {
                  const timeline = [
                    ...(records || []).map(r => ({ ...r, timelineType: 'record' as const })),
                    ...(tasks || []).filter(t => t.status !== "concluído" && t.status !== "ganho").map(t => ({ ...t, timelineType: 'task' as const, created_at: t.datetime }))
                  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

                  if (timeline.length === 0) {
                    return (
                      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum registro encontrado para este cliente.</p>
                        <p className="text-sm">Comece adicionando um novo atendimento ou tarefa.</p>
                      </div>
                    );
                  }

                  return timeline.map((item) => {
                    if (item.timelineType === 'record') {
                      const record = item as any;
                      return (
                        <Card 
                          key={record.id} 
                          className={cn(
                            "border-border/50 bg-card/50 backdrop-blur-sm border-l-4 transition-all",
                            record.type === "Tarefa concluída" 
                              ? "border-l-emerald-500 hover:border-l-emerald-600 cursor-pointer hover:bg-emerald-500/5 shadow-sm hover:shadow-md" 
                              : "border-l-primary/50"
                          )}
                          onClick={() => {
                            if (record.type === "Tarefa concluída" && record.task_id) {
                              tasksApi.get(record.task_id).then(handleEditTask);
                            }
                          }}
                        >
                          <CardHeader className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={record.type === "Tarefa concluída" ? "default" : "outline"} 
                                  className={cn("capitalize", record.type === "Tarefa concluída" && "bg-emerald-600 hover:bg-emerald-700")}
                                >
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditRecord(record);
                                  }}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRecord(record.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3 px-4 pt-0">
                            {record.type === "Tarefa concluída" && record.task_title && (
                              <h4 className="text-sm font-bold text-foreground mb-1">
                                {record.task_title}
                              </h4>
                            )}
                            <p className={cn(
                              "text-sm whitespace-pre-wrap",
                              record.type === "Tarefa concluída" ? "text-foreground/80 italic" : "text-foreground"
                            )}>
                              {record.type === "Tarefa concluída" ? `"${record.description}"` : record.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    } else {
                      const task = item as any;
                      return (
                        <Card key={task.id} className="border-border/50 bg-card/50 backdrop-blur-sm border-l-4 border-l-amber-500/50">
                          <CardHeader className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="gap-1.5">
                                  <Calendar className="h-3 w-3" />
                                  Atividade
                                </Badge>
                                 <Badge
                                   variant={task.status === "concluído" ? "default" : "outline"}
                                   className={`capitalize text-sm font-bold px-3 py-0.5 ${task.status === "concluído" ? "bg-green-600 hover:bg-green-600 text-white" : ""}`}
                                 >
                                  {task.status === "pendente" ? "Pendente" : 
                                   task.status === "em_andamento" ? "Em Andamento" : 
                                   task.status === "concluído" ? "Concluído" : "Cancelada"}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Agendado: {formatDateTime(task.datetime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={`h-7 w-7 ${task.status === "concluído" ? "text-green-600" : "text-muted-foreground"}`}
                                  onClick={() => toggleTaskStatusMutation.mutate(task)}
                                  title={task.status === "concluído" ? "Desmarcar como concluído" : "Marcar como concluído"}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditTask(task)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3 px-4 pt-0">
                            <h4 className="text-sm font-semibold mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    }
                  });
                })()
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

        <TaskFormDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          task={editingTask}
          defaultClientId={id}
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