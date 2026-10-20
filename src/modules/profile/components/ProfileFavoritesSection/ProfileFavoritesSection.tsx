"use client";

import { BookMarked } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import { BookCard } from "@/components/bookCard/bookCard";
import { ListGrid } from "@/components/listGrid";
import { Button } from "@/components/ui/button";

import type { ProfileFavoritesSectionProps } from "./types/profileFavoritesSection.types";

function ProfileFavoritesSectionComponent({
  books,
  isLoading,
  isFetched,
  isError,
  allBooksHref,
  hideInteractions = false,
}: ProfileFavoritesSectionProps) {
  return (
    <section className="space-y-4" aria-labelledby="profile-favorites-heading">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="profile-favorites-heading"
          className="inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          <BookMarked className="size-5 shrink-0 text-rose-500" aria-hidden />
          Livros favoritos
        </h2>
      </div>

      <ListGrid
        items={books}
        isLoading={isLoading}
        isFetched={isFetched}
        isError={isError}
        skeletonCount={6}
        emptyMessage="Nenhum livro favorito ainda."
        renderItem={(book) => (
          <BookCard
            key={book.id}
            book={book}
            hideInteractions={hideInteractions}
          />
        )}
      />

      <Button
        asChild
        variant="outline"
        className="min-h-11 w-full cursor-pointer rounded-xl border-violet-200 text-violet-800 hover:bg-violet-50 sm:w-auto dark:border-violet-800/60 dark:text-violet-200 dark:hover:bg-violet-950/50"
      >
        <Link href={allBooksHref}>Ver todos os livros</Link>
      </Button>
    </section>
  );
}

export default memo(ProfileFavoritesSectionComponent);
