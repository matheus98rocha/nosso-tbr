"use client";

import {
  Calendar,
  Mail,
  Search,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        <h1 className="page-title text-zinc-900 dark:text-zinc-100">
          Meu perfil 📚
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
          Olá! 👋 Aqui fica sua conta, quem você segue e a comunidade. Explore
          estantes e troque recomendações.
        </p>
      </header>

      <Card className="dark:bg-zinc-900/50 rounded-2xl shadow-md gap-0 py-0 overflow-hidden border border-violet-200/60 dark:border-violet-900/40">
        <div className="h-20 sm:h-24 bg-linear-to-br from-violet-500/30 via-fuchsia-500/15 to-amber-300/25 dark:from-violet-600/25 dark:via-fuchsia-600/10 dark:to-amber-500/15" />
        <CardHeader className="px-6 pb-6 -mt-8 relative border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <ProfileInitialsAvatar
              initials={viewModel.avatarInitials}
              size="lg"
              className="ring-4 ring-white dark:ring-zinc-900 shadow-lg"
            />
            <div className="space-y-2 min-w-0 flex-1 pt-1 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-100 truncate">
                  {viewModel.displayName}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="rounded-lg gap-1 font-normal bg-violet-100 text-violet-900 dark:bg-violet-950/80 dark:text-violet-200 border-0"
                >
                  <Sparkles className="size-3.5 shrink-0" aria-hidden />
                  Leitor
                </Badge>
              </div>
              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Mail className="size-4 shrink-0 text-zinc-400" aria-hidden />
                  <span className="truncate text-zinc-600 dark:text-zinc-300">
                    {viewModel.userEmail}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                  <Users className="size-4 shrink-0" aria-hidden />
                  Seguindo{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-200 tabular-nums">
                    {viewModel.followingCount}
                  </span>
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-6 space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Datas importantes da sua jornada por aqui.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-4 py-3">
              <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <Calendar className="size-3.5" aria-hidden />
                Conta criada
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {viewModel.formattedAccountCreated}
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-4 py-3">
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
        className="dark:bg-zinc-900/50 rounded-2xl border border-violet-200/40 dark:border-violet-900/30 shadow-md overflow-hidden"
        aria-labelledby="community-heading"
      >
        <div className="p-4 sm:p-6 space-y-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1">
            <h2
              id="community-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Comunidade 🤝
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Encontre leitores por nome ou e-mail. Abra um perfil tocando no
              nome ou siga em um clique.
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
              aria-label="Buscar pessoas na comunidade"
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
              Carregando leitores...
            </li>
          ) : viewModel.isCommunityEmpty ? (
            <li className="px-4 sm:px-6 py-12 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Não encontramos nenhum leitor com esse termo.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-11 rounded-xl cursor-pointer transition-colors"
                onClick={viewModel.onClearCommunitySearch}
                aria-label="Limpar busca de pessoas"
              >
                Limpar busca
              </Button>
            </li>
          ) : (
            viewModel.communityRows.map((row) => (
              <li key={row.memberId}>
                <CommunityMemberFollowRow
                  memberId={row.memberId}
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
