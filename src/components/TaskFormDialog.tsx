 import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
  import { CalendarDays, Check, CheckCircle2, ChevronsUpDown, Clock, Pencil, Trash2, User as UserIcon } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
  import { format } from "date-fns";
  import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
 import { Textarea } from "@/components/ui/textarea";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { tasksApi, clientsApi, authApi, type Task, type TaskInput, type TaskCompleteInput } from "@/lib/api";
import { TaskCompletionDialog } from "./TaskCompletionDialog";
import { isPast, isToday } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  title: z.string().trim().min(1, "O título é obrigatório").max(200),
  description: z.string().trim().max(2000).optional(),
  datetime: z.string().min(1, "A data e hora são obrigatórias"),
  status: z.enum(["pendente", "em_andamento", "concluído", "cancelada", "ganho"]),
  client_id: z.string().optional().nullable().or(z.literal("")),
  user_id: z.string().min(1, "Selecione o responsável"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultDate?: string;
  defaultClientId?: string;
}

export function TaskFormDialog({ open, onOpenChange, task, defaultDate, defaultClientId }: Props) {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const isEditing = Boolean(task);
   const [isLocked, setIsLocked] = useState(isEditing);
   const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
   const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
 
   const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      datetime: "",
      status: "pendente",
      client_id: "",
      user_id: user?.id || "",
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: clientsApi.list,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["team"],
    queryFn: authApi.listTeam,
  });

  useEffect(() => {
     if (open) {
       if (task) {
         form.reset({
           title: task.title,
           description: task.description || "",
           datetime: task.datetime.slice(0, 16), // Format for datetime-local input
           status: task.status,
           client_id: task.client_id || "",
           user_id: task.user_id,
         });
         setIsLocked(true);
       } else {
         form.reset({
           title: "",
           description: "",
           datetime: defaultDate ? defaultDate.slice(0, 16) : "",
           status: "pendente",
           client_id: defaultClientId || "",
           user_id: user?.id || "",
         });
         setIsLocked(false);
       }
     }
   }, [open, task, form, user, defaultDate, defaultClientId]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues & { completionData?: Partial<TaskCompleteInput>, execution_description?: string }) => {
      // Caso 1: Finalização de tarefa (fluxo do modal de conclusão)
      if (isEditing && task && (values.status === "concluído" || values.status === "ganho") && values.completionData) {
        return tasksApi.complete(task.id, {
          status: values.status,
          description: values.completionData.description!,
        });
      }

      const payload: any = {
        title: values.title,
        description: values.description || null,
        datetime: new Date(values.datetime).toISOString(),
        status: values.status,
        client_id: values.client_id || null,
        user_id: values.user_id,
      };

      // Se houver alteração na descrição da execução (mesmo que o status não tenha mudado)
      if (isEditing && task && values.execution_description) {
        payload.execution_description = values.execution_description;
      }

      if (isEditing && task) {
        return tasksApi.update(task.id, payload);
      } else {
        return tasksApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["client-records"] });
      const clientId = form.getValues("client_id") || task?.client_id;
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ["client-tasks", clientId] });
        queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      }
      toast({
        title: isEditing ? "Tarefa atualizada" : "Tarefa criada",
        description: isEditing ? "As alterações foram salvas." : "A tarefa foi adicionada à agenda.",
      });
       onOpenChange(false);
     },
     onError: (err: Error) => {
       toast({
         title: "Erro ao salvar",
         description: err.message,
         variant: "destructive",
       });
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async () => {
       if (!task) return;
       return tasksApi.remove(task.id);
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["tasks"] });
       if (task?.client_id) {
         queryClient.invalidateQueries({ queryKey: ["client-tasks", task.client_id] });
       }
       toast({
         title: "Tarefa excluída",
         description: "A tarefa foi removida com sucesso.",
       });
       onOpenChange(false);
     },
     onError: (err: Error) => {
       toast({
         title: "Erro ao excluir",
         description: err.message,
         variant: "destructive",
       });
     },
   });
 
  const handleSubmit = (values: FormValues) => {
    const statusChangedToCompleted = (values.status === "concluído" || values.status === "ganho") && (!task || task.status !== values.status);
    
    if (isEditing && statusChangedToCompleted) {
      setPendingValues(values);
      setCompletionDialogOpen(true);
      return;
    }
    mutation.mutate(values);
  };

  const handleConfirmCompletion = (completionData: any) => {
    if (pendingValues) {
      mutation.mutate({ ...pendingValues, completionData });
      setCompletionDialogOpen(false);
    }
  };

  // Se estiver concluindo ou ganhando na visualização travada, não mostramos o form principal
  const isShowingCompletionOnly = completionDialogOpen && pendingValues;

   const isCompleted = task?.status === "concluído" || task?.status === "ganho";

  return (
    <>
    <Dialog 
      open={open && !isShowingCompletionOnly} 
      onOpenChange={(val) => {
        if (!val) {
          setCompletionDialogOpen(false);
          setPendingValues(null);
        }
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="min-w-0 w-full max-w-full overflow-hidden">
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "Detalhes da tarefa" : "Nova tarefa"}
            {isCompleted && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase text-[10px] font-bold">
                Concluído
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCompleted 
              ? "Visualize as informações da execução desta tarefa."
              : "Preencha os detalhes da tarefa ou compromisso."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
             <FormField
               control={form.control}
               name="title"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Título *</FormLabel>
                   <FormControl>
                     <Input placeholder="Ex: Reunião de apresentação" {...field} disabled={isLocked} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="datetime"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Data e Hora *</FormLabel>
                     <FormControl>
                       <Input type="datetime-local" {...field} disabled={isLocked} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

               <FormField
                 control={form.control}
                 name="status"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Selecione o status" />
                         </SelectTrigger>
                       </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em andamento</SelectItem>
                           <SelectItem value="concluído">Concluído</SelectItem>
                           <SelectItem value="ganho">Ganho</SelectItem>
                           <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )}
               />
            </div>

             <FormField
               control={form.control}
               name="client_id"
               render={({ field }) => (
                 <FormItem className="flex flex-col">
                   <FormLabel>Cliente vinculado</FormLabel>
                   <Popover>
                     <PopoverTrigger asChild disabled={isLocked}>
                       <FormControl>
                         <Button
                           variant="outline"
                           role="combobox"
                           disabled={isLocked}
                           className={cn(
                             "w-full justify-between font-normal",
                             !field.value && "text-muted-foreground"
                           )}
                         >
                           {field.value
                             ? clients.find((c) => c.id === field.value)?.name
                             : "Selecionar cliente (opcional)"}
                           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                         </Button>
                       </FormControl>
                     </PopoverTrigger>
                     <PopoverContent className="w-[400px] p-0">
                       <Command>
                         <CommandInput placeholder="Buscar cliente..." />
                         <CommandList>
                           <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                           <CommandGroup>
                             <CommandItem
                               onSelect={() => {
                                 form.setValue("client_id", "");
                               }}
                             >
                               <Check
                                 className={cn(
                                   "mr-2 h-4 w-4",
                                   field.value === "" ? "opacity-100" : "opacity-0"
                                 )}
                               />
                               Nenhum (Sem vínculo)
                             </CommandItem>
                             {clients.map((c) => (
                               <CommandItem
                                 key={c.id}
                                 value={c.name}
                                 onSelect={() => {
                                   form.setValue("client_id", c.id);
                                 }}
                               >
                                 <Check
                                   className={cn(
                                     "mr-2 h-4 w-4",
                                     c.id === field.value ? "opacity-100" : "opacity-0"
                                   )}
                                 />
                                 {c.name} {c.company ? `(${c.company})` : ""}
                               </CommandItem>
                             ))}
                           </CommandGroup>
                         </CommandList>
                       </Command>
                     </PopoverContent>
                   </Popover>
                   <FormMessage />
                 </FormItem>
               )}
             />

             <FormField
               control={form.control}
               name="user_id"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Responsável *</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isLocked}>
                     <FormControl>
                       <SelectTrigger>
                         <SelectValue placeholder="Selecione o responsável" />
                       </SelectTrigger>
                     </FormControl>
                     <SelectContent>
                       {users.map((u) => (
                         <SelectItem key={u.id} value={u.id}>
                           {u.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   <FormMessage />
                 </FormItem>
               )}
             />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel>Instruções da tarefa</FormLabel>
                       <FormControl>
                        {isCompleted && isLocked ? (
                          <div className="text-sm text-foreground/80 bg-muted/30 p-3 rounded border italic">
                            {field.value || "Sem instruções adicionais."}
                          </div>
                        ) : (
                          <Textarea
                            placeholder="Instruções e detalhes do planejamento..."
                            rows={3}
                            {...field}
                            disabled={isLocked}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isCompleted && task?.execution_log && (
                  <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest border-b border-emerald-500/10 pb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      ✔ O que foi feito:
                    </div>
                    <div className="space-y-2 min-w-0 w-full max-w-full overflow-hidden">
                      {isPast(new Date(task.datetime)) && !isToday(new Date(task.datetime)) && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase bg-red-500/10 w-fit px-2 py-0.5 rounded">
                          <Clock className="h-3 w-3" />
                          Finalizada com atraso
                        </div>
                      )}
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap italic break-words [overflow-wrap:anywhere] [word-break:break-word] overflow-hidden w-full max-w-full">
                        {task.execution_log.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 border-t border-emerald-500/10">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>Concluído em: <strong>{format(new Date(task.execution_log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                        <span>Responsável: <strong>{task.execution_log.user_name || "Responsável"}</strong></span>
                      </div>
                    </div>
                    {!isLocked && (
                      <div className="pt-3 border-t border-emerald-500/10">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2 block">Editar registro de execução:</label>
                        <Textarea 
                          defaultValue={task.execution_log.description}
                          onChange={(e) => {
                            const val = e.target.value;
                           // Injeta o valor no formulário para ser enviado no submit
                           form.setValue("execution_description" as any, val, { shouldDirty: true });
                          }}
                          className="text-sm bg-background/50 border-emerald-500/20 focus-visible:ring-emerald-500"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

             <DialogFooter className="gap-2 sm:gap-0">
                {isLocked && isEditing && (
                  <div className="flex w-full justify-between items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Fechar
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        className="gap-2"
                        onClick={() => setIsLocked(false)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar tudo
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => handleSubmit(form.getValues())}
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? "Salvando..." : "Salvar status"}
                      </Button>
                    </div>
                  </div>
                )}
                {(!isLocked || !isEditing) && (
                 <div className="flex w-full justify-between items-center gap-2">
                   {isEditing && (
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button
                           type="button"
                           variant="destructive"
                           className="gap-2 mr-auto"
                           disabled={deleteMutation.isPending}
                         >
                           <Trash2 className="h-4 w-4" />
                           Excluir
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                             <AlertDialogDescription>
                             Esta ação não pode ser desfeita. A tarefa será removida permanentemente da agenda.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancelar</AlertDialogCancel>
                           <AlertDialogAction
                             onClick={() => deleteMutation.mutate()}
                             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                           >
                             {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                   )}
                   <div className="flex gap-2 ml-auto">
                     <Button
                       type="button"
                       variant="outline"
                       onClick={() => (isEditing ? setIsLocked(true) : onOpenChange(false))}
                       disabled={mutation.isPending}
                     >
                       {isEditing ? "Voltar" : "Cancelar"}
                     </Button>
                     <Button type="submit" disabled={mutation.isPending}>
                       {mutation.isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
                     </Button>
                   </div>
                 </div>
               )}
             </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {pendingValues && (pendingValues.status === "concluído" || pendingValues.status === "ganho") && (
      <TaskCompletionDialog
        open={completionDialogOpen}
        onOpenChange={(val) => {
          setCompletionDialogOpen(val);
          if (!val) {
            onOpenChange(false); // Fecha tudo se cancelar o registro
            setPendingValues(null);
          }
        }}
        status={pendingValues.status}
        onConfirm={handleConfirmCompletion}
        isPending={mutation.isPending}
      />
    )}
    </>
  );
}