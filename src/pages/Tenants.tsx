import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tenantsApi } from "@/lib/api";
import { NewTenantDialog } from "@/components/NewTenantDialog";

export default function Tenants() {
  const [newOpen, setNewOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: tenantsApi.list,
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
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Empresas (Tenants)
              </h1>
              <p className="text-xs text-muted-foreground">
                Visão SaaS-wide — apenas super_admin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4" />
                Painel Admin
              </Link>
            </Button>
            <Button onClick={() => setNewOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar empresas</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="w-32">Usuários</TableHead>
                <TableHead className="w-32">Clientes</TableHead>
                <TableHead className="w-48">Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    Nenhuma empresa cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.users_count}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.clients_count}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(t.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <NewTenantDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
