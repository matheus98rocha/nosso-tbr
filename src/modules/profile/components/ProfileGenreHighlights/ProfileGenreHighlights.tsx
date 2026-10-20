"use client";

import { Sparkles } from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";

import type { ProfileGenreHighlightsProps } from "./types/profileGenreHighlights.types";

function ProfileGenreHighlightsComponent({
  mostReadGenderLabel,
  mostRegisteredGenderLabel,
  isLoading = false,
  isError = false,
}: ProfileGenreHighlightsProps) {
  if (isLoading) {
    return (
      <div
        className="h-20 animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/50"
        aria-hidden
      />
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Não foi possível carregar os gêneros em destaque.
      </p>
    );
  }

  const hasGenres = Boolean(mostReadGenderLabel || mostRegisteredGenderLabel);

  return (
    <section
      className="space-y-3"
      aria-labelledby="profile-genre-highlights-heading"
    >
      <h2
        id="profile-genre-highlights-heading"
        className="inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
      >
        <Sparkles className="size-5 shrink-0 text-amber-500" aria-hidden />
        Gêneros em destaque
      </h2>
      {hasGenres ? (
        <dl className="flex flex-wrap gap-2">
          {mostReadGenderLabel ? (
            <div className="space-y-1">
              <dt className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Mais lido
              </dt>
              <dd>
                <Badge variant="secondary" className="rounded-lg font-normal">
                  {mostReadGenderLabel}
                </Badge>
              </dd>
            </div>
          ) : null}
          {mostRegisteredGenderLabel ? (
            <div className="space-y-1">
              <dt className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Mais cadastrado
              </dt>
              <dd>
                <Badge variant="secondary" className="rounded-lg font-normal">
                  {mostRegisteredGenderLabel}
                </Badge>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ainda não há gênero destacado com os livros visíveis.
        </p>
      )}
    </section>
  );
}

export default memo(ProfileGenreHighlightsComponent);
