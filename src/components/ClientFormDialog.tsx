import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

 import { Plus, Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
 import { clientsApi, originsApi, type Client } from "@/lib/api";

const schema = z.object({
  type: z.enum(["PF", "PJ"]),
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(120, "Máximo 120 caracteres"),
  company: z.string().trim().max(120).optional(),
   birth_date: z
     .string()
     .trim()
     .regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Use o formato AAAA-MM-DD")
     .optional(),
   email: z.string().trim().max(120).optional().or(z.literal("")),
   phone: z.string().trim().max(20).optional(),
   cpf_cnpj: z.string().trim().max(20).optional(),
    source: z.string().trim().min(1, "Selecione a origem").max(100),
   address: z.string().trim().max(255, "Máximo 255 caracteres").optional(),
   notes: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
}).superRefine((data, ctx) => {
  if (data.type === "PJ" && (!data.company || data.company.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O nome da empresa é obrigatório para pessoa jurídica",
      path: ["company"],
    });
  }
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function ClientFormDialog({ open, onOpenChange, client }: Props) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(client);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
        type: "PF",
       name: "",
       company: "",
       birth_date: "",
       email: "",
       phone: "",
       cpf_cnpj: "",
       source: "",
       address: "",
       notes: "",
     },
  });

   const [newSearchSource, setNewSearchSource] = useState("");
   const [popoverOpen, setPopoverOpen] = useState(false);
   const [originDialogOpen, setOriginDialogOpen] = useState(false);
   const [newOriginName, setNewOriginName] = useState("");
 
   const { data: sources = ["Indicação", "Lead"], refetch: refetchSources } = useQuery({
     queryKey: ["origins"],
     queryFn: originsApi.list,
   });
 
   useEffect(() => {
     if (open) {
       form.reset({
          type: (client as any)?.type ?? "PF",
          name: client?.name ?? "",
          company: client?.company ?? "",
          birth_date: client?.birth_date ?? "",
          email: client?.email ?? "",
          phone: client?.phone ?? "",
          cpf_cnpj: client?.cpf_cnpj ?? "",
          source: client?.source ?? "",
          address: client?.address ?? "",
          notes: client?.notes ?? "",
        });
     }
   }, [open, client, form]);
 
   const originMutation = useMutation({
     mutationFn: (name: string) => originsApi.create({ name }),
     onSuccess: (name) => {
       refetchSources();
       form.setValue("source", name);
       setOriginDialogOpen(false);
       setNewOriginName("");
       setPopoverOpen(false);
       toast({ title: "Origem salva", description: `A origem "${name}" foi cadastrada.` });
     },
     onError: (err: Error) => {
       toast({
         variant: "destructive",
         title: "Erro ao salvar origem",
         description: err.message,
       });
     },
   });
 
   const handleSaveOrigin = () => {
     const trimmed = newOriginName.trim();
     if (!trimmed) {
       toast({ variant: "destructive", title: "Campo obrigatório", description: "Informe o nome da origem." });
       return;
     }
     originMutation.mutate(trimmed);
   };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
          type: values.type,
         name: values.name,
         company: values.company?.trim() ? values.company.trim() : null,
         birth_date: values.birth_date?.trim() ? values.birth_date.trim() : null,
         email: values.email?.trim() ? values.email.trim() : null,
         phone: values.phone?.trim() ? values.phone.trim() : null,
         cpf_cnpj: values.cpf_cnpj?.trim() ? values.cpf_cnpj.trim() : null,
         source: values.source?.trim() ? values.source.trim() : null,
         address: values.address?.trim() ? values.address.trim() : null,
         notes: values.notes?.trim() ? values.notes.trim() : null,
       };
      return isEditing && client
        ? clientsApi.update(client.id, payload)
        : clientsApi.create(payload);
    },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["clients"] });
       if (isEditing && client) {
         queryClient.invalidateQueries({ queryKey: ["client", client.id] });
       }
      toast({
        title: isEditing ? "Cliente atualizado" : "Cliente criado",
        description: isEditing
          ? "As alterações foram salvas."
          : "O cliente foi adicionado ao CRM.",
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

   return (
     <>
       <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Tipo de Cliente</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PF" id="pf" />
                        <Label htmlFor="pf" className="font-normal cursor-pointer">Pessoa Física</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PJ" id="pj" />
                        <Label htmlFor="pj" className="font-normal cursor-pointer">Pessoa Jurídica</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa{form.watch("type") === "PJ" ? " *" : ""}</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="email"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Email</FormLabel>
                     <FormControl>
                       <Input placeholder="email@exemplo.com" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="phone"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Telefone</FormLabel>
                     <FormControl>
                       <Input placeholder="(00) 00000-0000" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="cpf_cnpj"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>CPF / CNPJ</FormLabel>
                     <FormControl>
                       <Input placeholder="000.000.000-00" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="birth_date"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Data de nascimento</FormLabel>
                     <FormControl>
                       <Input type="date" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
                />
 
               <FormField
                 control={form.control}
                 name="source"
                 render={({ field }) => (
                   <FormItem className="flex flex-col">
                      <FormLabel className="mb-2">Origem *</FormLabel>
                     <Popover
                       open={popoverOpen}
                         onOpenChange={(open) => {
                           setPopoverOpen(open);
                           if (!open) setNewSearchSource("");
                         }}
                     >
                       <PopoverTrigger asChild>
                         <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                             className={cn(
                               "w-full justify-between font-normal",
                               !field.value && "text-muted-foreground"
                             )}
                           >
                             {field.value || "Selecione a origem"}
                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                           </Button>
                         </FormControl>
                       </PopoverTrigger>
                       <PopoverContent className="w-[200px] p-0" align="start">
                         <Command>
                              <CommandInput 
                                placeholder="Buscar ou criar nova..." 
                                value={newSearchSource}
                                onValueChange={setNewSearchSource}
                              />
                              <CommandList className="max-h-[300px] overflow-y-auto">
                                <CommandEmpty>Nenhuma origem encontrada.</CommandEmpty>
                                 <CommandGroup>
                                    <CommandItem onSelect={() => setOriginDialogOpen(true)}>
                                     <Plus className="mr-2 h-4 w-4" />
                                     Novo
                                   </CommandItem>
                                 </CommandGroup>
 
                                 {newSearchSource &&
                                   !sources.some(
                                     (s) => s.toLowerCase() === newSearchSource.toLowerCase()
                                   ) && (
                                     <CommandGroup>
                                       <CommandItem
                                         value={newSearchSource}
                                         onSelect={() => originMutation.mutate(newSearchSource)}
                                       >
                                         <Plus className="mr-2 h-4 w-4" />
                                         Criar "{newSearchSource}"
                                       </CommandItem>
                                     </CommandGroup>
                                   )}
 
                                <CommandGroup heading="Sugestões">
                                 {sources.map((s) => (
                                   <CommandItem
                                     key={s}
                                     value={s}
                                     onSelect={() => {
                                       form.setValue("source", s);
                                       setPopoverOpen(false);
                                     }}
                                   >
                                     <Check
                                       className={cn(
                                         "mr-2 h-4 w-4",
                                         s === field.value ? "opacity-100" : "opacity-0"
                                       )}
                                     />
                                     {s}
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
             </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anotação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o cliente..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar alterações"
                    : "Criar cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
       </Dialog>
 
       <Dialog open={originDialogOpen} onOpenChange={setOriginDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
         <DialogHeader>
           <DialogTitle>Nova Origem</DialogTitle>
            <DialogDescription>
             Cadastre uma nova origem para os clientes.
           </DialogDescription>
         </DialogHeader>
         <div className="grid gap-4 py-4">
           <div className="grid gap-2">
             <label htmlFor="origin-name" className="text-sm font-medium">
               Nome da origem
             </label>
             <Input
               id="origin-name"
               value={newOriginName}
               onChange={(e) => setNewOriginName(e.target.value)}
                placeholder="Ex: Instagram, Indicação..."
               autoFocus
               onKeyDown={(e) => {
                 if (e.key === "Enter") {
                   e.preventDefault();
                   handleSaveOrigin();
                 }
               }}
             />
           </div>
         </div>
         <DialogFooter className="gap-2 sm:gap-0">
           <Button
             type="button"
             variant="ghost"
             onClick={() => setOriginDialogOpen(false)}
           >
             Cancelar
           </Button>
           <Button 
             type="button" 
             onClick={handleSaveOrigin}
             disabled={originMutation.isPending}
           >
             {originMutation.isPending ? "Salvando..." : "Salvar"}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
     </>
   );
 }
