import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, LayoutDashboard, LogOut, Plus, Search, Shield, User as UserIcon, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientsTable } from "@/components/ClientsTable";
import { ClientFormDialog } from "@/components/ClientFormDialog";
import { Agenda } from "@/components/Agenda";
import { clientsApi, type Client } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, logout, hasRole } = useAuth();
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
        c.name.toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q)
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
    <div className="flex h-screen flex-col bg-background overflow-hidden">
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
          <div className="flex items-center gap-2">
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Usuário">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.name}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hasRole("super_admin") && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Painel Master
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6">
        <Tabs defaultValue="clients" className="flex flex-1 flex-col gap-4 overflow-hidden">
          <TabsList>
            <TabsTrigger value="clients" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="agenda" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Agenda
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="flex-1 space-y-4 overflow-auto pb-4">
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
                  placeholder="Buscar por nome ou empresa..."
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
          </TabsContent>

          <TabsContent value="agenda" className="m-0 flex-1 overflow-hidden p-0">
            <Agenda />
          </TabsContent>

        </Tabs>
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
