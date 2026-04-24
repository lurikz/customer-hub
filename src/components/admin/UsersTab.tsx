 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { Plus, Filter } from "lucide-react";
import { adminApi, apiConfig } from "@/lib/api";
 import { Button } from "@/components/ui/button";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { useState } from "react";
 import { toast } from "sonner";
 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";
 
 export function UsersTab() {
   const queryClient = useQueryClient();
   const [open, setOpen] = useState(false);
   const [tenantFilter, setTenantFilter] = useState("all");
 
   const { data: users, isLoading } = useQuery({
     queryKey: ["admin-users"],
     queryFn: adminApi.listUsers,
   });
 
   const { data: companies } = useQuery({
     queryKey: ["admin-tenants"],
     queryFn: adminApi.listTenants,
   });
 
   const { data: roles } = useQuery({
     queryKey: ["admin-roles"],
     queryFn: adminApi.listRoles,
   });
 
   const mutation = useMutation({
     mutationFn: adminApi.createUser,
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin-users"] });
       setOpen(false);
       toast.success("Usuário criado com sucesso!");
     },
     onError: (error: any) => {
       toast.error(error.message || "Erro ao criar usuário");
     },
   });
 
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
     mutation.mutate({
       name: formData.get("name"),
       email: formData.get("email"),
       password: formData.get("password"),
       tenant_id: formData.get("tenant_id"),
       role_id: formData.get("role_id"),
       role: "user", // Default internal role
     });
   };
 
   const filteredUsers = tenantFilter === "all" 
     ? users 
     : users?.filter(u => u.tenant_id === tenantFilter);
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div className="flex items-center gap-3">
           <h3 className="text-xl font-semibold">Usuários</h3>
           <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-lg border border-border/50">
             <Filter className="h-4 w-4 text-muted-foreground" />
             <Select value={tenantFilter} onValueChange={setTenantFilter}>
               <SelectTrigger className="h-8 w-[200px] border-none bg-transparent shadow-none focus:ring-0">
                 <SelectValue placeholder="Filtrar por empresa" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todas as empresas</SelectItem>
                 {companies?.map((c) => (
                   <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>
         <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
             <Button className="gap-2">
               <Plus className="h-4 w-4" /> Novo Usuário
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Novo Usuário</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="name">Nome Completo</Label>
                 <Input id="name" name="name" required />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="email">Email</Label>
                 <Input id="email" name="email" type="email" required />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="password">Senha</Label>
                 <Input id="password" name="password" type="password" required />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="tenant_id">Empresa</Label>
                 <Select name="tenant_id" required>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione a empresa" />
                   </SelectTrigger>
                   <SelectContent>
                     {companies?.map((c) => (
                       <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="role_id">Perfil de Permissão</Label>
                 <Select name="role_id" required>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o perfil" />
                   </SelectTrigger>
                   <SelectContent>
                     {roles?.map((r) => (
                       <SelectItem key={r.id} value={r.id}>{r.name} {r.tenant_id ? "" : "(Global)"}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={mutation.isPending || apiConfig.isDemo()}
                >
                  {apiConfig.isDemo() ? "Não disponível em modo demo" : (mutation.isPending ? "Criando..." : "Criar Usuário")}
               </Button>
             </form>
           </DialogContent>
         </Dialog>
       </div>
 
       <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
         <Table>
           <TableHeader className="bg-accent/50">
             <TableRow className="border-border/50 hover:bg-transparent">
               <TableHead>Nome</TableHead>
               <TableHead>Email</TableHead>
               <TableHead>Empresa</TableHead>
               <TableHead>Perfil</TableHead>
               <TableHead>Tipo</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {isLoading ? (
               <TableRow>
                 <TableCell colSpan={5} className="py-10 text-center">Carregando...</TableCell>
               </TableRow>
             ) : filteredUsers?.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                   Nenhum usuário encontrado.
                 </TableCell>
               </TableRow>
             ) : (
               filteredUsers?.map((u) => (
                 <TableRow key={u.id} className="border-border/50">
                   <TableCell className="font-medium">{u.name}</TableCell>
                   <TableCell className="text-muted-foreground">{u.email}</TableCell>
                   <TableCell>{u.tenant_name || "—"}</TableCell>
                   <TableCell>{u.role_name || "Sem perfil"}</TableCell>
                   <TableCell>
                     <Badge variant={u.role === "super_admin" ? "destructive" : "secondary"}>
                       {u.role}
                     </Badge>
                   </TableCell>
                 </TableRow>
               ))
             )}
           </TableBody>
         </Table>
       </div>
     </div>
   );
 }