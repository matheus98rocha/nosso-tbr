"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COMMUNITY_PATH } from "@/lib/routes/community";
import { cn } from "@/lib/utils";
import {
  ProfileAvatar,
  ProfileFavoritesSection,
  ProfileGenreHighlights,
  ProfileReadingActivity,
} from "@/modules/profile/components";
import {
  useProfileNetworkCounts,
  useProfileReadingShowcase,
} from "@/modules/profile/hooks";
import {
  useMemberProfile,
  useMemberProfileFavorites,
} from "@/modules/profile/memberProfile/hooks";
import { initialsFromDisplayName } from "@/modules/profile/utils/initials";

type MemberProfileViewProps = {
  userId: string;
};

function MemberProfileViewComponent({ userId }: MemberProfileViewProps) {
  const {
    profile,
    isLoading,
    isNotFound,
    isError,
    isFollowing,
    onToggleFollow,
    toggleBusy,
  } = useMemberProfile(userId);

  const {
    data: favoriteBooks = [],
    isLoading: favoritesLoading,
    isFetched: favoritesFetched,
    isError: favoritesError,
  } = useMemberProfileFavorites(userId);

  const showcaseQuery = useProfileReadingShowcase(userId);
  const networkQuery = useProfileNetworkCounts(userId);

  const reduceMotion = useReducedMotion();
  const allBooksHref = `/?reader=${encodeURIComponent(userId)}`;
  const showcase = showcaseQuery.data;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-700/50" />
        <div className="h-52 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-700/50" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-7 text-center">
        <p className="text-zinc-700 dark:text-zinc-200">
          Algo deu errado ao carregar este perfil. Tente de novo em instantes.
        </p>
        <Button asChild variant="outline" className="cursor-pointer rounded-xl">
          <Link href="/profile">Voltar ao meu perfil</Link>
        </Button>
      </div>
    );
  }

  if (isNotFound || !profile) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-7 text-center">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Leitor não encontrado
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Esse link pode estar desatualizado ou o usuário não existe mais por
          aqui.
        </p>
        <Button asChild variant="outline" className="cursor-pointer rounded-xl">
          <Link href="/profile">Voltar ao meu perfil</Link>
        </Button>
      </div>
    );
  }

  const initials = initialsFromDisplayName(profile.displayName);
  const followingCount = networkQuery.data?.followingCount ?? 0;
  const followerCount = networkQuery.data?.followerCount ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-7">
      <Link
        href="/profile"
        className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Meu perfil e comunidade
      </Link>

      <header className="space-y-2">
        <h1 className="page-title text-zinc-900 dark:text-zinc-100">
          Perfil de leitor 📖
        </h1>
        <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400">
          Conheça quem também marca leituras por aqui.
        </p>
      </header>

      <Card className="gap-0 overflow-hidden rounded-2xl border border-violet-200/60 py-0 shadow-md dark:border-violet-900/40 dark:bg-zinc-900/50">
        <div className="h-24 bg-linear-to-br from-violet-500/25 via-fuchsia-500/15 to-amber-400/20 sm:h-28 dark:from-violet-500/20 dark:via-fuchsia-600/10 dark:to-amber-500/10" />
        <CardHeader className="relative -mt-10 px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <ProfileAvatar
              initials={initials}
              avatarSeed={profile.avatarSeed}
              size="lg"
              className="shadow-lg ring-4 ring-white dark:ring-zinc-900"
              alt={`Avatar de ${profile.displayName}`}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:pt-0">
              <div className="min-w-0 space-y-1">
                <CardTitle className="truncate text-2xl text-zinc-900 dark:text-zinc-100">
                  {profile.displayName}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4 shrink-0" aria-hidden />
                    Seguindo{" "}
                    <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                      {followingCount}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4 shrink-0" aria-hidden />
                    Seguidores{" "}
                    <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
                      {followerCount}
                    </span>
                  </span>
                </CardDescription>
              </div>
              <Button
                type="button"
                variant={isFollowing ? "secondary" : "default"}
                className={cn(
                  "h-11 min-w-[128px] shrink-0 cursor-pointer rounded-xl transition-colors duration-200",
                  !toggleBusy && "active:scale-[0.98] active:duration-100",
                  toggleBusy && "disabled:opacity-100",
                )}
                disabled={toggleBusy}
                onClick={onToggleFollow}
                aria-busy={toggleBusy}
                aria-pressed={isFollowing}
                aria-label={
                  isFollowing
                    ? `Deixar de seguir ${profile.displayName}`
                    : `Seguir ${profile.displayName}`
                }
              >
                <span className="relative flex min-h-5 items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={isFollowing ? "following" : "follow"}
                      initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.16,
                        ease: [0.33, 1, 0.68, 1],
                      }}
                      className="inline-block will-change-transform motion-reduce:transition-none"
                    >
                      {isFollowing ? "Seguindo" : "Seguir"}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Quer ver mais leitores? Vá à{" "}
            <Link
              href={COMMUNITY_PATH}
              className="cursor-pointer font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              Comunidade
            </Link>
            .
          </p>
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

      <ProfileFavoritesSection
        books={favoriteBooks}
        isLoading={favoritesLoading}
        isFetched={favoritesFetched}
        isError={favoritesError}
        allBooksHref={allBooksHref}
        hideInteractions
      />
    </div>
  );
}

export default memo(MemberProfileViewComponent);
