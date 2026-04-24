 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { Plus } from "lucide-react";
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
 import { Checkbox } from "@/components/ui/checkbox";
 import { useState } from "react";
 import { toast } from "sonner";
 
 export function PlansTab() {
   const queryClient = useQueryClient();
   const [open, setOpen] = useState(false);
   const [features, setFeatures] = useState({
     clientes: false,
     agenda: false,
   });
 
   const { data: plans, isLoading } = useQuery({
     queryKey: ["admin-plans"],
     queryFn: adminApi.listPlans,
   });
 
   const mutation = useMutation({
     mutationFn: adminApi.createPlan,
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
       setOpen(false);
       setFeatures({ clientes: false, agenda: false });
       toast.success("Plano criado com sucesso!");
     },
     onError: (error: any) => {
       toast.error(error.message || "Erro ao criar plano");
     },
   });
 
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
     mutation.mutate({
       name: formData.get("name"),
       max_users: parseInt(formData.get("max_users") as string),
       features,
     });
   };
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h3 className="text-xl font-semibold">Planos</h3>
         <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
             <Button className="gap-2">
               <Plus className="h-4 w-4" /> Novo Plano
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Novo Plano</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="name">Nome do Plano</Label>
                 <Input id="name" name="name" required />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="max_users">Limite de Usuários</Label>
                 <Input id="max_users" name="max_users" type="number" required />
               </div>
               <div className="space-y-4">
                 <Label>Funcionalidades Ativas</Label>
                 <div className="flex items-center space-x-2">
                   <Checkbox 
                     id="feat_clientes" 
                     checked={features.clientes} 
                     onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, clientes: !!checked }))}
                   />
                   <label htmlFor="feat_clientes" className="text-sm font-medium leading-none">Clientes</label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Checkbox 
                     id="feat_agenda" 
                     checked={features.agenda} 
                     onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, agenda: !!checked }))}
                   />
                   <label htmlFor="feat_agenda" className="text-sm font-medium leading-none">Agenda</label>
                 </div>
               </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={mutation.isPending || apiConfig.isDemo()}
                >
                  {apiConfig.isDemo() ? "Não disponível em modo demo" : (mutation.isPending ? "Criando..." : "Criar Plano")}
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
               <TableHead>Limite Usuários</TableHead>
               <TableHead>Features</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {isLoading ? (
               <TableRow>
                 <TableCell colSpan={3} className="py-10 text-center">Carregando...</TableCell>
               </TableRow>
             ) : plans?.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                   Nenhum plano cadastrado.
                 </TableCell>
               </TableRow>
             ) : (
               plans?.map((p) => (
                 <TableRow key={p.id} className="border-border/50">
                   <TableCell className="font-medium">{p.name}</TableCell>
                   <TableCell>{p.max_users}</TableCell>
                   <TableCell>
                     <div className="flex gap-2">
                       {Object.entries(p.features).filter(([_, v]) => v).map(([k]) => (
                         <span key={k} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-bold">
                           {k}
                         </span>
                       ))}
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