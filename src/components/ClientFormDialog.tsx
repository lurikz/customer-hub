import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Plus, Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { clientsApi, type Client } from "@/lib/api";

const schema = z.object({
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
  source: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
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
      name: "",
      company: "",
      birth_date: "",
      source: "",
      notes: "",
    },
  });

  const [sources, setSources] = useState<string[]>(["Indicações", "Lead"]);
  const [newSource, setNewSource] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (open) {
      form.reset({
        name: client?.name ?? "",
        company: client?.company ?? "",
        birth_date: client?.birth_date ?? "",
        source: client?.source ?? "",
        notes: client?.notes ?? "",
      });
    }
  }, [open, client, form]);

  useEffect(() => {
    const savedSources = localStorage.getItem("crm.sources");
    if (savedSources) {
      setSources(JSON.parse(savedSources));
    }
  }, []);

  const addSource = () => {
    const trimmed = newSource.trim();
    if (trimmed && !sources.includes(trimmed)) {
      const updated = [...sources, trimmed];
      setSources(updated);
      localStorage.setItem("crm.sources", JSON.stringify(updated));
      form.setValue("source", trimmed);
      setNewSource("");
    }
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        company: values.company?.trim() ? values.company.trim() : null,
        birth_date: values.birth_date?.trim() ? values.birth_date.trim() : null,
        source: values.source?.trim() ? values.source.trim() : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      return isEditing && client
        ? clientsApi.update(client.id, payload)
        : clientsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo. Apenas o nome é obrigatório.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Maria Silva" {...field} />
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
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="ACME Ltda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <FormLabel className="mb-2">Origem</FormLabel>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
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
                            placeholder="Buscar ou criar..." 
                            value={newSource}
                            onValueChange={setNewSource}
                          />
                          <CommandList>
                            <CommandEmpty className="p-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-start text-xs"
                                onClick={addSource}
                              >
                                <Plus className="mr-2 h-3 w-3" />
                                Criar "{newSource}"
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
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
  );
}
