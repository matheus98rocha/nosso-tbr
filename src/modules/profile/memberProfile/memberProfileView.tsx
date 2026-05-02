"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BookMarked, Mail } from "lucide-react";
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
import { BookCard } from "@/components/bookCard/bookCard";
import { ListGrid } from "@/components/listGrid";
import { cn } from "@/lib/utils";
import { ProfileInitialsAvatar } from "@/modules/profile/components";
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

  const reduceMotion = useReducedMotion();
  const allBooksHref = `/?reader=${encodeURIComponent(userId)}`;

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-7 space-y-6">
        <div className="h-10 w-48 rounded-lg bg-zinc-200/80 dark:bg-zinc-700/50 animate-pulse" />
        <div className="h-52 rounded-2xl bg-zinc-200/80 dark:bg-zinc-700/50 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-7 space-y-4 text-center">
        <p className="text-zinc-700 dark:text-zinc-200">
          Algo deu errado ao carregar este perfil. Tente de novo em instantes.
        </p>
        <Button asChild variant="outline" className="rounded-xl cursor-pointer">
          <Link href="/profile">Voltar ao meu perfil</Link>
        </Button>
      </div>
    );
  }

  if (isNotFound || !profile) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-7 space-y-4 text-center">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Leitor não encontrado
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Esse link pode estar desatualizado ou o usuário não existe mais por
          aqui.
        </p>
        <Button asChild variant="outline" className="rounded-xl cursor-pointer">
          <Link href="/profile">Voltar ao meu perfil</Link>
        </Button>
      </div>
    );
  }

  const initials = initialsFromDisplayName(profile.displayName);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-7 space-y-8">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors cursor-pointer"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Meu perfil e comunidade
      </Link>

      <header className="space-y-2">
        <h1 className="page-title text-zinc-900 dark:text-zinc-100">
          Perfil de leitor 📖
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl">
          Conheça quem também marca leituras por aqui.
        </p>
      </header>

      <Card className="dark:bg-zinc-900/50 rounded-2xl shadow-md gap-0 py-0 overflow-hidden border border-violet-200/60 dark:border-violet-900/40">
        <div className="h-24 sm:h-28 bg-linear-to-br from-violet-500/25 via-fuchsia-500/15 to-amber-400/20 dark:from-violet-500/20 dark:via-fuchsia-600/10 dark:to-amber-500/10" />
        <CardHeader className="px-6 pb-6 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            <ProfileInitialsAvatar
              initials={initials}
              size="lg"
              className="ring-4 ring-white dark:ring-zinc-900 shadow-lg"
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between flex-1 min-w-0 pt-2 sm:pt-0">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-100 truncate">
                  {profile.displayName}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <Mail className="size-4 shrink-0 text-zinc-400" aria-hidden />
                    <span className="truncate text-zinc-600 dark:text-zinc-300">
                      {profile.email || "—"}
                    </span>
                  </span>
                </CardDescription>
              </div>
              <Button
                type="button"
                variant={isFollowing ? "secondary" : "default"}
                className={cn(
                  "h-11 min-w-[128px] shrink-0 rounded-xl cursor-pointer transition-colors duration-200",
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
        <CardContent className="pt-0 pb-6 px-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Quer ver mais leitores? Volte à{" "}
            <Link
              href="/profile"
              className="text-violet-600 dark:text-violet-400 font-medium hover:underline cursor-pointer"
            >
              busca na comunidade
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4" aria-labelledby="member-profile-favorites-heading">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="member-profile-favorites-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-2"
          >
            <BookMarked className="size-5 text-rose-500 shrink-0" aria-hidden />
            Livros favoritos
          </h2>
        </div>

        <ListGrid
          items={favoriteBooks}
          isLoading={favoritesLoading}
          isFetched={favoritesFetched}
          isError={favoritesError}
          skeletonCount={6}
          emptyMessage="Nenhum livro favorito ainda."
          renderItem={(book) => (
            <BookCard key={book.id} book={book} hideInteractions />
          )}
        />

        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto min-h-11 rounded-xl border-violet-200 text-violet-800 hover:bg-violet-50 dark:border-violet-800/60 dark:text-violet-200 dark:hover:bg-violet-950/50 cursor-pointer"
        >
          <Link href={allBooksHref}>Ver todos os livros</Link>
        </Button>
      </section>
    </div>
  );
}

export default memo(MemberProfileViewComponent);
