import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
  import { Pencil, Trash2, User, ExternalLink, Building2, Phone } from "lucide-react";
 import { getWhatsAppLink } from "@/lib/utils";
 import { useMutation, useQueryClient } from "@tanstack/react-query";
 import { Link, useNavigate } from "react-router-dom";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { clientsApi, type Client } from "@/lib/api";

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return value;
  }
}

 export function ClientsTable({ clients, onEdit }: Props) {
   const queryClient = useQueryClient();
   const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Cliente removido" });
    },
    onError: (e: Error) =>
      toast({
        title: "Erro ao remover",
        description: e.message,
        variant: "destructive",
      }),
  });

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Nenhum cliente cadastrado ainda. Clique em{" "}
          <span className="font-medium text-foreground">Novo Cliente</span> para
          começar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-[var(--shadow-soft)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Data Cadastro</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead className="w-[120px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
           {clients.map((c) => (
             <TableRow 
               key={c.id} 
               className="group cursor-pointer transition-colors hover:bg-muted/50"
               onClick={() => navigate(`/clientes/${c.id}`)}
             >
               <TableCell className="font-medium">
                 <div className="flex items-center gap-2">
                   {(c as any).type === "PJ" ? (
                      <Building2 className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                   <div className="flex flex-col">
                     <span className="group-hover:text-primary transition-colors">{c.name}</span>
                     {(c.company || (c as any).type === "PJ") && (
                        <span className="text-xs text-muted-foreground font-normal">{c.company || "Empresa"}</span>
                      )}
                      {false && c.company && (
                       <span className="text-xs text-muted-foreground font-normal">{c.company}</span>
                     )}
                   </div>
                 </div>
               </TableCell>
              <TableCell>{formatDate(c.created_at)}</TableCell>
              <TableCell>{c.source || "—"}</TableCell>
              <TableCell>{c.created_by_name || c.created_by || "—"}</TableCell>
               <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                    {c.phone && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        aria-label="WhatsApp"
                        className="text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
                      >
                        <a
                          href={getWhatsAppLink(c.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                   <Button
                     variant="ghost"
                     size="icon"
                     asChild
                     aria-label={`Ver perfil de ${c.name}`}
                   >
                     <Link to={`/clientes/${c.id}`}>
                       <ExternalLink className="h-4 w-4" />
                     </Link>
                   </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(c)}
                    aria-label={`Editar ${c.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O cliente{" "}
                          <strong>{c.name}</strong> será removido
                          permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(c.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
