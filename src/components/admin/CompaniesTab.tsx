 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { Plus, Edit2, Users as UsersIcon } from "lucide-react";
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
 
 export function CompaniesTab() {
   const queryClient = useQueryClient();
   const [open, setOpen] = useState(false);
 
   const { data: companies, isLoading } = useQuery({
     queryKey: ["admin-tenants"],
     queryFn: adminApi.listTenants,
   });
 
   const { data: plans } = useQuery({
     queryKey: ["admin-plans"],
     queryFn: adminApi.listPlans,
   });
 
   const mutation = useMutation({
     mutationFn: adminApi.createTenant,
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
       setOpen(false);
       toast.success("Empresa criada com sucesso!");
     },
     onError: (error: any) => {
       toast.error(error.message || "Erro ao criar empresa");
     },
   });
 
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
     mutation.mutate({
       name: formData.get("name"),
       cnpj: formData.get("cnpj"),
       plan_id: formData.get("plan_id"),
     });
   };
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h3 className="text-xl font-semibold">Empresas</h3>
         <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
             <Button className="gap-2">
               <Plus className="h-4 w-4" /> Nova Empresa
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Nova Empresa</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="name">Nome da Empresa</Label>
                 <Input id="name" name="name" required />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="cnpj">CNPJ</Label>
                 <Input id="cnpj" name="cnpj" />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="plan_id">Plano</Label>
                 <Select name="plan_id" required>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione um plano" />
                   </SelectTrigger>
                   <SelectContent>
                     {plans?.map((plan) => (
                       <SelectItem key={plan.id} value={plan.id}>
                         {plan.name} ({plan.max_users} usuários)
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={mutation.isPending || apiConfig.isDemo()}
                >
                  {apiConfig.isDemo() ? "Não disponível em modo demo" : (mutation.isPending ? "Criando..." : "Criar Empresa")}
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
               <TableHead>CNPJ</TableHead>
               <TableHead>Plano</TableHead>
               <TableHead>Usuários</TableHead>
               <TableHead className="text-right">Ações</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {isLoading ? (
               <TableRow>
                 <TableCell colSpan={5} className="py-10 text-center">Carregando...</TableCell>
               </TableRow>
             ) : companies?.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                   Nenhuma empresa cadastrada.
                 </TableCell>
               </TableRow>
             ) : (
               companies?.map((c) => (
                 <TableRow key={c.id} className="border-border/50">
                   <TableCell className="font-medium">{c.name}</TableCell>
                   <TableCell className="text-muted-foreground">{c.cnpj || "—"}</TableCell>
                   <TableCell>{c.plan_name || "Sem plano"}</TableCell>
                   <TableCell>
                     {c.users_count} / {c.max_users || "∞"}
                   </TableCell>
                   <TableCell className="text-right">
                     <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" title="Editar">
                         <Edit2 className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" title="Ver usuários">
                         <UsersIcon className="h-4 w-4" />
                       </Button>
                     </div>
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