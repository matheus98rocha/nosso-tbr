"use client";

import {
  Calendar,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileWelcomeTutorial } from "@/modules/onboarding";
import { AvatarSelectionPanel } from "@/modules/profile/avatarSelection";
import { useClientProfile } from "@/modules/profile/clientProfile/hooks";
import {
  ProfileAvatar,
  ProfileFavoritesSection,
  ProfileGenreHighlights,
  ProfileHubLinks,
  ProfileNetworkCountLinks,
  ProfileReadingActivity,
} from "@/modules/profile/components";
import {
  useProfileReadingShowcase,
} from "@/modules/profile/hooks";
import { useMemberProfileFavorites } from "@/modules/profile/memberProfile/hooks";

function ClientProfileView() {
  const viewModel = useClientProfile();
  const readerId = viewModel?.userId ?? "";
  const showcaseQuery = useProfileReadingShowcase(readerId);
  const favoritesQuery = useMemberProfileFavorites(readerId);

  if (!viewModel) {
    return null;
  }

  const showcase = showcaseQuery.data;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-7">
      <header className="space-y-2">
        <h1 className="page-title text-zinc-900 dark:text-zinc-100">
          Meu perfil 📚
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Sua conta, sua leitura e atalhos. Para descobrir leitores e seguir, use
          a Comunidade.
        </p>
      </header>

      <Card className="gap-0 overflow-hidden rounded-2xl border border-violet-200/60 py-0 shadow-md dark:border-violet-900/40 dark:bg-zinc-900/50">
        <div className="h-20 bg-linear-to-br from-violet-500/30 via-fuchsia-500/15 to-amber-300/25 sm:h-24 dark:from-violet-600/25 dark:via-fuchsia-600/10 dark:to-amber-500/15" />
        <CardHeader className="relative -mt-8 border-b border-zinc-200/80 px-6 pb-6 dark:border-zinc-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <ProfileAvatar
              initials={viewModel.avatarInitials}
              avatarSeed={viewModel.avatarSeed}
              size="lg"
              className="shadow-lg ring-4 ring-white dark:ring-zinc-900"
              alt={`Avatar de ${viewModel.displayName}`}
            />
            <div className="min-w-0 flex-1 space-y-2 pt-1 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="truncate text-2xl text-zinc-900 dark:text-zinc-100">
                  {viewModel.displayName}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-lg border-0 bg-violet-100 font-normal text-violet-900 dark:bg-violet-950/80 dark:text-violet-200"
                >
                  <Sparkles className="size-3.5 shrink-0" aria-hidden />
                  Leitor
                </Badge>
              </div>
              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Mail className="size-4 shrink-0 text-zinc-400" aria-hidden />
                  <span className="truncate text-zinc-600 dark:text-zinc-300">
                    {viewModel.userEmail}
                  </span>
                </span>
                <ProfileNetworkCountLinks
                  followingCount={viewModel.followingCount}
                  followerCount={viewModel.followerCount}
                  followingHref={viewModel.followingHref}
                  followersHref={viewModel.followersHref}
                />
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 py-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Datas importantes da sua jornada por aqui.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
              <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <Calendar className="size-3.5" aria-hidden />
                Conta criada
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {viewModel.formattedAccountCreated}
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
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

      <ProfileReadingActivity
        registeredCount={showcase?.registeredCount ?? 0}
        finishedCount={showcase?.finishedCount ?? 0}
        currentlyReadingTitle={showcase?.currentlyReadingTitle ?? null}
        isLoading={showcaseQuery.isLoading}
        isError={showcaseQuery.isError}
      />

      <ProfileGenreHighlights
        mostReadGenderLabel={showcase?.mostReadGenderLabel ?? null}
        mostRegisteredGenderLabel={
          showcase?.mostRegisteredGenderLabel ?? null
        }
        isLoading={showcaseQuery.isLoading}
        isError={showcaseQuery.isError}
      />

      <AvatarSelectionPanel />

      <ProfileWelcomeTutorial />

      <ProfileFavoritesSection
        books={favoritesQuery.data ?? []}
        isLoading={favoritesQuery.isLoading}
        isFetched={favoritesQuery.isFetched}
        isError={favoritesQuery.isError}
        allBooksHref={viewModel.allBooksHref}
        hideInteractions={false}
      />

      <ProfileHubLinks links={viewModel.hubLinks} />
    </div>
  );
}

export default memo(ClientProfileView);
