import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, LayoutDashboard, LogOut, Plus, Search, Shield, User as UserIcon, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";

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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList>
            <TabsTrigger value="clients" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[300px,1fr]">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <Calendar mode="single" className="rounded-md" />
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Agenda de Hoje</h3>
                  <Button variant="outline" size="sm">
                    Ver Tudo
                  </Button>
                </div>
                <div className="space-y-4">
                  {[
                    { time: "09:00", title: "Reunião com Novo Cliente", client: "João Silva" },
                    { time: "11:30", title: "Apresentação de Proposta", client: "Maria Oliveira" },
                    { time: "14:00", title: "Follow-up", client: "Pedro Santos" },
                    { time: "16:30", title: "Treinamento de Equipe", client: "Empresa ABC" },
                  ].map((event, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="min-w-[50px] text-sm font-medium text-primary">
                        {event.time}
                      </div>
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {event.client}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
