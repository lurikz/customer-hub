 import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
 import { Check, ChevronsUpDown, Pencil, Trash2 } from "lucide-react";
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
    mutationFn: async (values: FormValues) => {
      const payload: TaskInput = {
        title: values.title,
        description: values.description || null,
        datetime: new Date(values.datetime).toISOString(),
        status: values.status,
        client_id: values.client_id || null,
        user_id: values.user_id,
      };

      if (isEditing && task) {
        return tasksApi.update(task.id, payload);
      } else {
        return tasksApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (form.getValues("client_id")) {
        queryClient.invalidateQueries({ queryKey: ["client-tasks", form.getValues("client_id")] });
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
 
   return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da tarefa ou compromisso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
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

             <FormField
               control={form.control}
               name="description"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Descrição</FormLabel>
                   <FormControl>
                     <Textarea
                       placeholder="Detalhes adicionais..."
                       rows={3}
                       {...field}
                       disabled={isLocked}
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />

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
                        onClick={() => mutation.mutate(form.getValues())}
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
  );
}