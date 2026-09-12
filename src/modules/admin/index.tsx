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
    invites,
    isLoadingInvites,
    invitesError,
    createInvite,
    isCreatingInvite,
    copiedInviteId,
    copyInviteLink,
    formatInviteExpiry,
    formatLastSignIn,
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
    <div className="w-full max-w-6xl flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Administração</h1>
        <p className="text-sm text-muted-foreground">
          Usuários do sistema e convites de cadastro com validade de 24 horas.
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="invite-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 id="invite-heading" className="text-lg font-medium">
              Convites de cadastro
            </h2>
            <p className="text-sm text-muted-foreground">
              Cada link permite múltiplos cadastros até expirar. Gere um novo
              quando precisar convidar alguém.
            </p>
          </div>
          <Button
            type="button"
            onClick={createInvite}
            disabled={isCreatingInvite}
            className="shrink-0"
          >
            {isCreatingInvite ? "Gerando…" : "Gerar convite (24h)"}
          </Button>
        </div>

        {isLoadingInvites ? (
          <p className="text-sm text-muted-foreground">Carregando convites…</p>
        ) : invitesError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar os convites.
          </p>
        ) : invites.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Nenhum convite ativo. Gere um link para compartilhar o cadastro.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-3 rounded-md border px-4 py-3"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium">
                    Expira {formatInviteExpiry(invite.expires_at)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteLink(invite)}
                  >
                    {copiedInviteId === invite.id ? "Copiado" : "Copiar link"}
                  </Button>
                </div>
                <code className="break-all rounded-md bg-muted/40 px-3 py-2 text-xs sm:text-sm">
                  {invite.inviteUrl}
                </code>
              </li>
            ))}
          </ul>
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
                  <TableHead className="text-center">Livros</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.display_name}</TableCell>
                      <TableCell>{user.email ?? "—"}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {user.books_count}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLastSignIn(user.last_sign_in_at)}
                      </TableCell>
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
