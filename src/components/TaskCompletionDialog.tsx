import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const schema = z.object({
  description: z.string().trim().min(1, "O que foi feito é obrigatório"),
  result: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: FormValues) => void;
  isPending?: boolean;
  status: "concluído" | "ganho";
}

export function TaskCompletionDialog({ open, onOpenChange, onConfirm, isPending, status }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "",
      result: "",
      notes: "",
    },
  });

  const statusLabel = status === "concluído" ? "Concluir" : "Ganhar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{statusLabel} Tarefa</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da execução para finalizar esta tarefa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onConfirm)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O que foi feito? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva as ações realizadas..." 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resultado obtido</FormLabel>
                  <FormControl>
                    <Input placeholder="Qual foi o resultado?" {...field} />
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
                  <FormLabel>Observações internas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas adicionais para a equipe..." 
                      rows={2} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="bg-purple-600 hover:bg-purple-700">
                {isPending ? "Salvando..." : "Confirmar conclusão"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}