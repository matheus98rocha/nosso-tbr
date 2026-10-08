"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useVisibleRecapCovers } from "../../hooks/useVisibleRecapCovers";
import type { ReadingRecapPreviewProps } from "../../types";
import { toSameOriginCoverSrc } from "../../utils";

function ReadingRecapPreview({
  image,
  periodTitle,
  isEmpty,
  isLoading,
  isError,
  imageCount = 0,
  imageIndex = 0,
  onPrevious,
  onNext,
  onSelectImage,
}: ReadingRecapPreviewProps) {
  const covers = image?.coverSrcs ?? [];
  const { visibleCoverSrcs, handleCoverError } = useVisibleRecapCovers(covers);

  if (isLoading) {
    return (
      <Skeleton
        className="mx-auto aspect-[9/16] w-[min(100%,360px)] rounded-2xl"
        aria-label="Carregando recap de leitura"
      />
    );
  }

  if (isError) {
    return (
      <div
        className="mx-auto flex aspect-[9/16] w-[min(100%,360px)] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        role="alert"
      >
        Não foi possível carregar suas leituras.
      </div>
    );
  }

  const title = image?.title ?? periodTitle;
  const subtitle = image?.subtitle ?? null;
  const showNavigation = !isEmpty && imageCount > 1;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "grid w-full items-center justify-center gap-2",
          showNavigation
            ? "grid-cols-[auto_minmax(0,360px)_auto]"
            : "grid-cols-1",
        )}
      >
        {showNavigation ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            aria-label="Imagem anterior"
            onClick={onPrevious}
            disabled={imageIndex === 0}
          >
            <ChevronLeft />
          </Button>
        ) : null}
        <figure className="mx-auto w-[min(100%,360px)]">
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
              <div className="mt-3 grid flex-1 grid-cols-3 grid-rows-4 place-items-center gap-1.5">
                {visibleCoverSrcs.map((src, index) => (
                  <img
                    key={`${src}-${index}`}
                    src={toSameOriginCoverSrc(src)}
                    alt=""
                    className="h-[130px] w-[90px] rounded-md object-cover shadow-sm"
                    onError={() => handleCoverError(src)}
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
              Nenhuma leitura com capa cadastrada neste período. Tente outro dia,
              mês ou ano.
            </figcaption>
          ) : null}
        </figure>
        {showNavigation ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            aria-label="Próxima imagem"
            onClick={onNext}
            disabled={imageIndex >= imageCount - 1}
          >
            <ChevronRight />
          </Button>
        ) : null}
      </div>
      {showNavigation ? (
        <div
          className="flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Imagens do recap"
        >
          {Array.from({ length: imageCount }, (_, index) => {
            const isActive = index === imageIndex;

            return (
              <button
                key={`recap-image-dot-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Ir para imagem ${index + 1}`}
                onClick={() => onSelectImage?.(index)}
                className={cn(
                  "cursor-pointer rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  isActive
                    ? "h-2 w-5 bg-[#5B4BDB]"
                    : "h-2 w-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500",
                )}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default ReadingRecapPreview;
