import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
 import { ArrowLeft, Building2, LogOut, Shield, Users as UsersIcon } from "lucide-react";
 import { cn } from "@/lib/utils";

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
     <div className="space-y-8 pb-10">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
             <Shield className="h-8 w-8 text-primary" />
             Painel Master
           </h2>
           <p className="text-muted-foreground">Visão geral do sistema e gerenciamento de usuários.</p>
         </div>
         <div className="flex items-center gap-3">
           <Button asChild variant="outline" className="h-11 gap-2 rounded-xl border-white/10 bg-white/5 px-6 backdrop-blur-sm transition-all hover:bg-white/10">
             <Link to="/">
               <ArrowLeft className="h-4 w-4" />
               Ir ao CRM
             </Link>
           </Button>
         </div>
       </div>
 
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
           <h3 className="text-xl font-semibold text-white">Todos os usuários</h3>
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
 
         <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20 shadow-2xl backdrop-blur-sm">
           <Table>
             <TableHeader className="bg-white/5">
               <TableRow className="border-white/5 hover:bg-transparent">
                 <TableHead className="text-white">Nome</TableHead>
                 <TableHead className="text-white">E-mail</TableHead>
                 <TableHead className="text-white">Tenant</TableHead>
                 <TableHead className="text-white">Tipo</TableHead>
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
                 users.map((u) => (
                   <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors">
                     <TableCell className="font-medium text-white">
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
                           u.role === "super_admin" ? "bg-primary text-white hover:bg-primary/90" : ""
                         )}
                       >
                         {roleLabel[u.role] ?? u.role}
                       </Badge>
                     </TableCell>
                   </TableRow>
                 )
               ))}
             </TableBody>
           </Table>
         </div>
       </section>
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
     <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/20 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-primary/20">
       <div className="flex items-center justify-between">
         <p className="text-sm font-medium text-muted-foreground">{label}</p>
         <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
           <Icon className="h-4 w-4" />
         </div>
       </div>
       <p className="mt-4 text-4xl font-bold tracking-tight text-white">
         {value ?? "—"}
       </p>
       <div className="absolute -bottom-1 -right-1 h-12 w-12 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
     </div>
   );
}
