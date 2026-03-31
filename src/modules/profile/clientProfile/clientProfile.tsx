"use client";

import { memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Search, UserRound } from "lucide-react";
import { ProfileInitialsAvatar } from "@/modules/profile/components";
import { useClientProfile } from "@/modules/profile/clientProfile/hooks";
import CommunityMemberFollowRow from "../communityMemberFollowRow";

function ClientProfileView() {
  const viewModel = useClientProfile();

  if (!viewModel) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-7 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Perfil
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl">
          Suas informações da conta e a comunidade. Busque pessoas e gerencie
          quem você segue.
        </p>
      </header>

      <Card className="dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm gap-0 py-0 overflow-hidden">
        <CardHeader className="px-6 py-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <ProfileInitialsAvatar
              initials={viewModel.avatarInitials}
              size="md"
            />
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100 truncate">
                {viewModel.displayName}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Mail className="size-4 shrink-0 text-zinc-400" aria-hidden />
                  <span className="truncate text-zinc-600 dark:text-zinc-300">
                    {viewModel.userEmail}
                  </span>
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-6 space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 px-4 py-3">
              <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <Calendar className="size-3.5" aria-hidden />
                Conta criada
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {viewModel.formattedAccountCreated}
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 px-4 py-3">
              <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <UserRound className="size-3.5" aria-hidden />
                Último acesso
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {viewModel.formattedLastSignIn}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <section
        className="dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
        aria-labelledby="community-heading"
      >
        <div className="p-4 sm:p-6 space-y-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1">
            <h2
              id="community-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Pessoas na comunidade
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Busque por nome ou e-mail.
            </p>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <Input
              id="profile-user-search"
              type="search"
              value={viewModel.searchQuery}
              onChange={viewModel.onCommunitySearchChange}
              placeholder="Buscar pessoas..."
              className="h-11 pl-10 text-base md:text-sm rounded-xl border-zinc-200 dark:border-zinc-800"
              aria-label="Search people in the community"
              autoComplete="off"
            />
          </div>
        </div>

        <ul
          className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[min(420px,60vh)] overflow-y-auto"
          role="list"
        >
          {viewModel.isDirectoryLoading ? (
            <li className="px-4 sm:px-6 py-12 text-center text-sm text-zinc-500">
              Loading...
            </li>
          ) : viewModel.isCommunityEmpty ? (
            <li className="px-4 sm:px-6 py-12 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Não encontramos nenhum leitor...
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-11 rounded-xl cursor-pointer transition-colors"
                onClick={viewModel.onClearCommunitySearch}
                aria-label="Clear people search"
              >
                Limpar busca
              </Button>
            </li>
          ) : (
            viewModel.communityRows.map((row) => (
              <li key={row.memberId}>
                <CommunityMemberFollowRow
                  displayName={row.displayName}
                  email={row.email}
                  isFollowing={row.isFollowing}
                  isToggleBusy={row.isToggleBusy}
                  onPress={row.onToggle}
                />
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

export default memo(ClientProfileView);
