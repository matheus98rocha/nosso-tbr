"use client";

import { ConfirmDialog } from "@/components";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import useAdmin from "./hooks/useAdmin";

export default function AdminScreen() {
  const {
    isAdmin,
    isLoggedIn,
    users,
    isLoadingUsers,
    usersError,
    inviteUrl,
    inviteConfigured,
    isLoadingInvite,
    inviteError,
    copied,
    copyInviteLink,
    tierLabel,
    userPendingDelete,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteUser,
    promoteUser,
    canDeleteUser,
    canPromoteUser,
    isPromoting,
    promotingUserId,
  } = useAdmin();

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Administração</h1>
        <p className="text-sm text-muted-foreground">
          Usuários do sistema e link de convite para cadastro.
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="invite-heading">
        <h2 id="invite-heading" className="text-lg font-medium">
          Link de convite
        </h2>
        {isLoadingInvite ? (
          <p className="text-sm text-muted-foreground">Carregando link…</p>
        ) : inviteError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar o link de convite.
          </p>
        ) : !inviteConfigured || !inviteUrl ? (
          <p className="text-sm text-muted-foreground">
            Convite não configurado no servidor. Defina REGISTER_INVITE_SECRET.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 break-all rounded-md border bg-muted/40 px-3 py-2 text-sm">
              {inviteUrl}
            </code>
            <Button type="button" variant="outline" onClick={copyInviteLink}>
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="users-heading">
        <h2 id="users-heading" className="text-lg font-medium">
          Usuários
        </h2>
        {isLoadingUsers ? (
          <p className="text-sm text-muted-foreground">Carregando usuários…</p>
        ) : usersError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar os usuários.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.display_name}</TableCell>
                      <TableCell>{user.email ?? "—"}</TableCell>
                      <TableCell>{tierLabel(user.tier)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canPromoteUser(user) ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={
                                isPromoting && promotingUserId === user.id
                              }
                              onClick={() => promoteUser(user.id)}
                            >
                              Promover a admin
                            </Button>
                          ) : null}
                          {canDeleteUser(user) ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteConfirm(user)}
                            >
                              Excluir
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(userPendingDelete)}
        onOpenChange={(open) => {
          if (!open) closeDeleteConfirm();
        }}
        id={userPendingDelete?.id ?? ""}
        onConfirm={confirmDeleteUser}
        onCancel={closeDeleteConfirm}
        queryKeyToInvalidate="admin"
        title="Excluir usuário"
        buttonLabel="Excluir"
        description={`Tem certeza que deseja excluir ${userPendingDelete?.display_name ?? "este usuário"}? Essa ação remove o perfil e o login e não pode ser desfeita.`}
      />
    </div>
  );
}
