"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";
import { cn } from "@/lib/utils";

import type { ReadingRecapPreviewProps } from "../../types";
import { toSameOriginCoverSrc } from "../../utils";

function ReadingRecapPreview({
  image,
  periodTitle,
  isEmpty,
  isLoading,
  isError,
}: ReadingRecapPreviewProps) {
  if (isLoading) {
    return (
      <Skeleton
        className="mx-auto aspect-[9/16] w-[min(100%,220px)] rounded-2xl"
        aria-label="Carregando recap de leitura"
      />
    );
  }

  if (isError) {
    return (
      <div
        className="mx-auto flex aspect-[9/16] w-[min(100%,220px)] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        role="alert"
      >
        Não foi possível carregar suas leituras.
      </div>
    );
  }

  const title = image?.title ?? periodTitle;
  const subtitle = image?.subtitle ?? null;
  const covers = image?.coverSrcs ?? [];

  return (
    <figure className="mx-auto w-[min(100%,220px)]">
      <div
        className={cn(
          "relative aspect-[9/16] overflow-hidden rounded-2xl",
          "bg-[#F3EDE3] text-[#1C1917]",
          "shadow-[0_18px_40px_-24px_rgba(28,25,23,0.55)]",
        )}
        aria-label={title}
      >
        <div className="pointer-events-none absolute -left-10 -top-16 size-40 rounded-full bg-[#E8DFD2]" />
        <div className="pointer-events-none absolute -bottom-10 -right-8 size-36 rounded-full bg-[#E4D9F2]/80" />
        <div className="relative flex h-full flex-col px-3 pb-3 pt-4">
          <div className="text-center">
            <p className="brand-display text-[0.7rem] leading-tight font-semibold tracking-tight">
              {title}
            </p>
            {subtitle ? (
              <p className="mt-1 text-[0.55rem] font-medium tracking-wide text-[#78716C]">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="mt-3 grid flex-1 grid-cols-3 grid-rows-5 gap-1.5">
            {covers.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={toSameOriginCoverSrc(src)}
                alt=""
                className="h-full w-full rounded-sm object-cover"
                onError={(event) => {
                  event.currentTarget.src = BOOK_COVER_PLACEHOLDER_SRC;
                }}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-[0.55rem] font-semibold tracking-[0.18em] text-[#5B4BDB] uppercase">
            Nosso TBR
          </p>
        </div>
      </div>
      {isEmpty ? (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          Nenhuma leitura finalizada neste período. Tente outro dia, mês ou ano.
        </figcaption>
      ) : null}
    </figure>
  );
}

export default ReadingRecapPreview;
