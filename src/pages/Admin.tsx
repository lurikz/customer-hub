import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, LogOut, Shield, Users as UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const roleLabel: Record<string, string> = {
  user: "Usuário",
  admin: "Admin",
  super_admin: "Super Admin",
};

const roleVariant: Record<string, "secondary" | "default" | "destructive"> = {
  user: "secondary",
  admin: "default",
  super_admin: "destructive",
};

export default function Admin() {
  const { user, logout } = useAuth();

  const { data: overview, error: overviewError } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: adminApi.overview,
  });

  const { data: users, isLoading, error: usersError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.listUsers,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Painel Master
              </h1>
              <p className="text-xs text-muted-foreground">
                {user?.email} · {roleLabel[user?.role ?? ""] ?? user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Ir ao CRM
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {overviewError && (
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar painel</AlertTitle>
            <AlertDescription>{(overviewError as Error).message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Empresas" value={overview?.stats.tenants} icon={Building2} />
          <StatCard label="Usuários" value={overview?.stats.users} icon={UsersIcon} />
          <StatCard label="Clientes" value={overview?.stats.clients} icon={Shield} />
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Todos os usuários</h2>

          {usersError && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar usuários</AlertTitle>
              <AlertDescription>{(usersError as Error).message}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : !users || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      Nenhum usuário cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.name}
                        {u.id === user?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (você)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {u.tenant_id ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleVariant[u.role] ?? "secondary"}>
                          {roleLabel[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {value ?? "—"}
      </p>
    </div>
  );
}
