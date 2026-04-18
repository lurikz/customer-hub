import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { invitesApi, tokenStore, type InviteLookup } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const schema = z
  .object({
    name: z.string().trim().min(1, "Nome obrigatório").max(120),
    password: z.string().min(8, "Senha mínima de 8 caracteres").max(200),
    confirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  });

type FormValues = z.infer<typeof schema>;

const roleLabel: Record<string, string> = {
  user: "Usuário",
  admin: "Admin",
  super_admin: "Super Admin",
};

export default function Signup() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = params.get("token") || "";

  const [meta, setMeta] = useState<InviteLookup | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", password: "", confirm: "" },
  });

  useEffect(() => {
    if (!token) {
      setLookupError("Convite ausente.");
      return;
    }
    invitesApi
      .lookup(token)
      .then(setMeta)
      .catch((e: Error) => setLookupError(e.message));
  }, [token]);

  if (!loading && user && location.pathname !== "/signup") {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const { token: jwt } = await invitesApi.accept(token, values.name, values.password);
      tokenStore.set(jwt);
      // Recarrega para o AuthProvider buscar o /me com o novo token
      window.location.replace("/");
      void navigate;
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
          <p className="text-sm text-muted-foreground">
            Você foi convidado para acessar o CRM
          </p>
        </div>

        {lookupError ? (
          <Alert variant="destructive">
            <AlertDescription>{lookupError}</AlertDescription>
          </Alert>
        ) : !meta ? (
          <p className="text-center text-sm text-muted-foreground">
            Validando convite...
          </p>
        ) : (
          <>
            <div className="rounded-lg border bg-muted/50 p-4 text-sm">
              <p>
                <span className="text-muted-foreground">E-mail:</span>{" "}
                <strong>{meta.email}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">Acesso:</span>{" "}
                <strong>{roleLabel[meta.role] ?? meta.role}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Expira em {new Date(meta.expires_at).toLocaleString()}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu nome</FormLabel>
                      <FormControl>
                        <Input autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          {...field}
                        />
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

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={form.formState.isSubmitting}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {form.formState.isSubmitting ? "Criando..." : "Criar conta"}
                </Button>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
