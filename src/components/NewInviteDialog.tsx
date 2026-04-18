import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminApi, type Role } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .max(200),
  role: z.enum(["user", "admin", "super_admin"]),
  expiresInHours: z.coerce.number().int().min(1).max(168),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewInviteDialog({ open, onOpenChange }: Props) {
  const { hasRole } = useAuth();
  const isSuper = hasRole("super_admin");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "user", expiresInHours: 24 },
  });

  const reset = () => {
    form.reset();
    setError(null);
    setLink(null);
    setCopied(false);
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const { token } = await adminApi.createInvite({
        email: values.email,
        role: values.role,
        expiresInHours: values.expiresInHours,
      });
      const url = `${window.location.origin}/signup?token=${encodeURIComponent(token)}`;
      setLink(url);
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      toast({ title: "Convite criado" });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo convite</DialogTitle>
          <DialogDescription>
            Gere um link de cadastro de uso único.
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Copie e envie o link abaixo. Ele só será mostrado{" "}
                <strong>uma vez</strong>.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Input readOnly value={link} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail do convidado</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="off"
                        placeholder="convidado@empresa.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de acesso</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v as Role)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin" disabled={!isSuper}>
                          Admin {isSuper ? "" : "(apenas super_admin)"}
                        </SelectItem>
                        <SelectItem value="super_admin" disabled={!isSuper}>
                          Super Admin {isSuper ? "" : "(apenas super_admin)"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiresInHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade (horas)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={168} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Gerando..." : "Gerar link"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
