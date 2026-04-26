import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import { ArrowLeft, Building2, Shield, Users as UsersIcon, LayoutDashboard, CreditCard, Lock, Trash2 } from "lucide-react";
 import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { CompaniesTab } from "@/components/admin/CompaniesTab";
 import { UsersTab } from "@/components/admin/UsersTab";
 import { PlansTab } from "@/components/admin/PlansTab";
 import { RolesTab } from "@/components/admin/RolesTab";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
import { adminApi, apiConfig } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

  const cleanupMutation = useMutation({
    mutationFn: adminApi.cleanup,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Todos os registros de tarefas e histórico foram excluídos.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao realizar limpeza");
    },
  });

  const handleCleanup = () => {
    if (confirm("TEM CERTEZA? Esta ação excluirá TODAS as tarefas e históricos de TODOS os clientes. Esta ação não pode ser desfeita.")) {
      cleanupMutation.mutate();
    }
  };

  const { data: overview, error: overviewError } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: adminApi.overview,
  });

  const { data: users, isLoading, error: usersError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.listUsers,
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Painel Master
          </h2>
          <p className="text-muted-foreground">Gerenciamento completo do ecossistema.</p>
        </div>
        <div className="flex items-center gap-3">
          {!apiConfig.isDemo() && (
            <Button 
              variant="destructive" 
              className="h-11 gap-2 rounded-xl px-6"
              onClick={handleCleanup}
              disabled={cleanupMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {cleanupMutation.isPending ? "Limpando..." : "Limpar Dados"}
            </Button>
          )}
          <Button asChild variant="outline" className="h-11 gap-2 rounded-xl border-border/50 bg-card/50 px-6 backdrop-blur-sm transition-all hover:bg-accent">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Ir ao CRM
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-8">
        <TabsList className="h-12 w-full justify-start gap-6 bg-transparent p-0 border-b border-border/50 rounded-none">
          <TabsTrigger value="visao-geral" className="gap-2 border-b-2 border-transparent px-2 pb-4 pt-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent">
            <LayoutDashboard className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="empresas" className="gap-2 border-b-2 border-transparent px-2 pb-4 pt-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent">
            <Building2 className="h-4 w-4" /> Empresas
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2 border-b-2 border-transparent px-2 pb-4 pt-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent">
            <UsersIcon className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="planos" className="gap-2 border-b-2 border-transparent px-2 pb-4 pt-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent">
            <CreditCard className="h-4 w-4" /> Planos
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="gap-2 border-b-2 border-transparent px-2 pb-4 pt-2 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent">
            <Lock className="h-4 w-4" /> Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-8 mt-0 focus-visible:ring-0">
          {overviewError && (
            <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/10">
              <AlertTitle>Erro ao carregar painel</AlertTitle>
              <AlertDescription>{(overviewError as Error).message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 sm:grid-cols-3">
            <StatCard label="Empresas" value={overview?.stats.tenants} icon={Building2} />
            <StatCard label="Usuários" value={overview?.stats.users} icon={UsersIcon} />
            <StatCard label="Clientes" value={overview?.stats.clients} icon={Shield} />
          </div>

          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-semibold">Usuários Recentes</h3>
              <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                {users?.length || 0} Registrados
              </Badge>
            </div>

            {usersError && (
              <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/10">
                <AlertTitle>Erro ao carregar usuários</AlertTitle>
                <AlertDescription>{(usersError as Error).message}</AlertDescription>
              </Alert>
            )}

            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-accent/50">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !users || users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-muted-foreground">
                        Nenhum usuário cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.slice(0, 10).map((u) => (
                      <TableRow key={u.id} className="border-border/50 hover:bg-accent/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {u.name}
                            {u.id === user?.id && (
                              <Badge variant="outline" className="text-[10px] h-4 border-primary/30 text-primary uppercase px-1">você</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground/70">
                          {u.tenant_id ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={roleVariant[u.role] ?? "secondary"}
                            className={cn(
                              "rounded-md px-2 py-0.5",
                              u.role === "super_admin" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                            )}
                          >
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
        </TabsContent>

        <TabsContent value="empresas" className="mt-0 focus-visible:ring-0">
          <CompaniesTab />
        </TabsContent>

        <TabsContent value="usuarios" className="mt-0 focus-visible:ring-0">
          <UsersTab />
        </TabsContent>

        <TabsContent value="planos" className="mt-0 focus-visible:ring-0">
          <PlansTab />
        </TabsContent>

        <TabsContent value="permissoes" className="mt-0 focus-visible:ring-0">
          <RolesTab />
        </TabsContent>
      </Tabs>
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
      <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-primary/20">
       <div className="flex items-center justify-between">
         <p className="text-sm font-medium text-muted-foreground">{label}</p>
         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
           <Icon className="h-4 w-4" />
         </div>
       </div>
        <p className="mt-4 text-4xl font-bold tracking-tight">
         {value ?? "—"}
       </p>
       <div className="absolute -bottom-1 -right-1 h-12 w-12 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
     </div>
   );
}
