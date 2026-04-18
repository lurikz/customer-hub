import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClientsTable } from "@/components/ClientsTable";
import { ClientFormDialog } from "@/components/ClientFormDialog";
import { clientsApi, type Client } from "@/lib/api";

const Index = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: clientsApi.list,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        (c.notes ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">CRM</h1>
              <p className="text-xs text-muted-foreground">
                Gestão simples de clientes
              </p>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar clientes</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, empresa ou anotação..."
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {data ? `${filtered.length} de ${data.length} clientes` : "—"}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-lg border p-12 text-center text-muted-foreground">
            Carregando clientes...
          </div>
        ) : (
          <ClientsTable clients={filtered} onEdit={openEdit} />
        )}
      </main>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
      />
    </div>
  );
};

export default Index;
