import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Plus, Shield, Trash2, UserPlus } from "lucide-react";

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminApi, type AdminUser, type Invite } from "@/lib/api";
import { NewUserDialog } from "@/components/NewUserDialog";
import { NewInviteDialog } from "@/components/NewInviteDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

function inviteStatus(inv: Invite): { label: string; variant: "secondary" | "default" | "destructive" } {
  if (inv.used_at) return { label: "Usado", variant: "secondary" };
  if (new Date(inv.expires_at) <= new Date()) return { label: "Expirado", variant: "destructive" };
  return { label: "Pendente", variant: "default" };
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);

  const { data: users, isLoading: loadingUsers, error: usersError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.listUsers,
  });

  const { data: invites, isLoading: loadingInvites, error: invitesError } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: adminApi.listInvites,
  });

  const deleteUserMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast({ title: "Usuário excluído" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setToDelete(null);
    },
    onError: (e: Error) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => adminApi.revokeInvite(id),
    onSuccess: () => {
      toast({ title: "Convite revogado" });
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
    },
    onError: (e: Error) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Painel Admin
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestão de usuários e convites do tenant
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao CRM
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="invites">Convites</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setNewOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo usuário
              </Button>
            </div>

            {usersError && (
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar usuários</AlertTitle>
                <AlertDescription>{(usersError as Error).message}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : !users || users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        Nenhum usuário cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.name}
                          {u.id === user?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (você)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleVariant[u.role] ?? "secondary"}>
                            {roleLabel[u.role] ?? u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={u.id === user?.id}
                            onClick={() => setToDelete(u)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="invites" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setInviteOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Novo convite
              </Button>
            </div>

            {invitesError && (
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar convites</AlertTitle>
                <AlertDescription>{(invitesError as Error).message}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingInvites ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : !invites || invites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                        Nenhum convite emitido.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invites.map((inv) => {
                      const status = inviteStatus(inv);
                      const pending = !inv.used_at && new Date(inv.expires_at) > new Date();
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {inv.email ?? "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleVariant[inv.role] ?? "secondary"}>
                              {roleLabel[inv.role] ?? inv.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(inv.expires_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!pending || revokeMut.isPending}
                              onClick={() => revokeMut.mutate(inv.id)}
                              aria-label="Revogar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <NewUserDialog open={newOpen} onOpenChange={setNewOpen} />
      <NewInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `${toDelete.name} (${toDelete.email}) perderá acesso imediatamente.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteUserMut.mutate(toDelete.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
