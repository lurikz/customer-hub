 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { Plus } from "lucide-react";
 import { adminApi } from "@/lib/api";
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
 import { Checkbox } from "@/components/ui/checkbox";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { useState } from "react";
 import { toast } from "sonner";
 
 export function RolesTab() {
   const queryClient = useQueryClient();
   const [open, setOpen] = useState(false);
   const [permissions, setPermissions] = useState<any>({
     clients: { visualizar: false, editar: false, excluir: false },
     agenda: { acessar: false, criar: false, editar: false, excluir: false },
   });
 
   const { data: roles, isLoading } = useQuery({
     queryKey: ["admin-roles"],
     queryFn: adminApi.listRoles,
   });
 
   const { data: companies } = useQuery({
     queryKey: ["admin-tenants"],
     queryFn: adminApi.listTenants,
   });
 
   const mutation = useMutation({
     mutationFn: adminApi.createRole,
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
       setOpen(false);
       setPermissions({
         clients: { visualizar: false, editar: false, excluir: false },
         agenda: { acessar: false, criar: false, editar: false, excluir: false },
       });
       toast.success("Perfil criado com sucesso!");
     },
     onError: (error: any) => {
       toast.error(error.message || "Erro ao criar perfil");
     },
   });
 
   const togglePermission = (entity: string, action: string) => {
     setPermissions((prev: any) => ({
       ...prev,
       [entity]: {
         ...prev[entity],
         [action]: !prev[entity][action]
       }
     }));
   };
 
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
     mutation.mutate({
       name: formData.get("name"),
       tenant_id: formData.get("tenant_id") === "global" ? null : formData.get("tenant_id"),
       permissions,
     });
   };
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h3 className="text-xl font-semibold">Perfis de Acesso (Roles)</h3>
         <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
             <Button className="gap-2">
               <Plus className="h-4 w-4" /> Novo Perfil
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-2xl">
             <DialogHeader>
               <DialogTitle>Novo Perfil de Permissões</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="name">Nome do Perfil</Label>
                   <Input id="name" name="name" placeholder="Ex: Vendedor, Gerente" required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="tenant_id">Empresa (Opcional)</Label>
                   <Select name="tenant_id" defaultValue="global">
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="global">Global (Para todas)</SelectItem>
                       {companies?.map(c => (
                         <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
 
               <div className="space-y-4">
                 <Label className="text-lg font-bold">Permissões</Label>
                 
                 <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                   <h4 className="font-semibold text-primary">Clientes</h4>
                   <div className="flex gap-6">
                     {['visualizar', 'editar', 'excluir'].map(act => (
                       <div key={act} className="flex items-center space-x-2">
                         <Checkbox 
                           id={`perm_clients_${act}`} 
                           checked={permissions.clients[act]} 
                           onCheckedChange={() => togglePermission('clients', act)}
                         />
                         <label htmlFor={`perm_clients_${act}`} className="text-sm capitalize">{act}</label>
                       </div>
                     ))}
                   </div>
                 </div>
 
                 <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                   <h4 className="font-semibold text-primary">Agenda</h4>
                   <div className="flex gap-6">
                     {['acessar', 'criar', 'editar', 'excluir'].map(act => (
                       <div key={act} className="flex items-center space-x-2">
                         <Checkbox 
                           id={`perm_agenda_${act}`} 
                           checked={permissions.agenda[act]} 
                           onCheckedChange={() => togglePermission('agenda', act)}
                         />
                         <label htmlFor={`perm_agenda_${act}`} className="text-sm capitalize">{act}</label>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
 
               <Button type="submit" className="w-full" disabled={mutation.isPending}>
                 {mutation.isPending ? "Criando..." : "Criar Perfil"}
               </Button>
             </form>
           </DialogContent>
         </Dialog>
       </div>
 
       <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
         <Table>
           <TableHeader className="bg-accent/50">
             <TableRow className="border-border/50 hover:bg-transparent">
               <TableHead>Perfil</TableHead>
               <TableHead>Empresa</TableHead>
               <TableHead>Tipo</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {isLoading ? (
               <TableRow>
                 <TableCell colSpan={3} className="py-10 text-center">Carregando...</TableCell>
               </TableRow>
             ) : roles?.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                   Nenhum perfil cadastrado.
                 </TableCell>
               </TableRow>
             ) : (
               roles?.map((r) => (
                 <TableRow key={r.id} className="border-border/50">
                   <TableCell className="font-medium">{r.name}</TableCell>
                   <TableCell>{r.tenant_name || "—"}</TableCell>
                   <TableCell>{r.tenant_id ? "Local" : "Global"}</TableCell>
                 </TableRow>
               ))
             )}
           </TableBody>
         </Table>
       </div>
     </div>
   );
 }