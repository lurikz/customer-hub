 import { useMemo, useState, useEffect } from "react";
 import { useSearchParams } from "react-router-dom";
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
   const { user, hasRole, hasFeature, hasPermission } = useAuth();
   const [searchParams, setSearchParams] = useSearchParams();
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

   const activeTab = searchParams.get("tab") || "clients";
 
  const isClientsDisabled = !hasFeature("clientes") || !hasPermission("clients.visualizar");
  const isAgendaDisabled = !hasFeature("agenda") || !hasPermission("agenda.acessar");

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Gerencie seus clientes e compromissos com facilidade.</p>
        </div>
        {activeTab === "clients" && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={openNew} 
              disabled={!hasPermission("clients.editar")}
              className="h-11 gap-2 rounded-xl bg-primary px-6 font-semibold shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
              Novo Cliente
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="flex w-full flex-1 flex-col overflow-hidden">
        <TabsContent value="clients" className="space-y-6 outline-none">
          {isClientsDisabled ? (
            <PlanRestrictionMessage feature="Clientes" />
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou empresa..."
                    className="h-12 rounded-xl border-border/50 bg-background/50 pl-11 backdrop-blur-sm transition-all focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {data ? (
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      {filtered.length} de {data.length} clientes
                    </span>
                  ) : "—"}
                </p>
              </div>

              {error ? (
                <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/10">
                  <AlertTitle>Erro ao carregar clientes</AlertTitle>
                  <AlertDescription>{(error as Error).message}</AlertDescription>
                </Alert>
              ) : isLoading ? (
                <div className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Carregando dados dos clientes...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
                  <ClientsTable clients={filtered} onEdit={openEdit} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="agenda" className="flex flex-1 flex-col overflow-hidden pt-6 outline-none">
          {isAgendaDisabled ? (
            <PlanRestrictionMessage feature="Agenda" />
          ) : (
            <div className="flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
              <Agenda />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
      />
    </div>
  );
};

function PlanRestrictionMessage({ feature }: { feature: string }) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center py-20 text-center space-y-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="bg-destructive/10 p-4 rounded-full">
        <Shield className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="text-xl font-bold">Funcionalidade não disponível</h3>
      <p className="text-muted-foreground max-w-md">
        Seu plano atual ou perfil de usuário não permite o acesso à {feature}. 
        Entre em contato com o administrador para realizar o upgrade.
      </p>
    </div>
   );
 }
 
 export default Index;
