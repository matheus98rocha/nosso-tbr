"use client";

import { ProfileInitialsAvatar } from "@/modules/profile/components";
import type { ProfileInitialsAvatarSize } from "@/modules/profile/components";
import { initialsFromDisplayName } from "@/modules/profile/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Medal, Trophy } from "lucide-react";
import type { ReadingLeaderboardEntryDomain } from "@/modules/stats/types/stats.types";
import type { ReadingRankingMetric } from "@/modules/stats/types/stats.types";

/** Máximo de leitores exibidos no pódio (layout adapta até este limite). */
export const LEADERBOARD_PODIUM_MAX = 5;

type PodiumPlace = 1 | 2 | 3 | 4 | 5;

/**
 * Ordena os colocados para exibição em faixa horizontal (maior no centro / simétrico).
 * Entrada: slice do ranking já ordenado (índice 0 = 1º lugar).
 */
export function buildPodiumSlots(
  ranked: ReadingLeaderboardEntryDomain[] | undefined,
): { entry: ReadingLeaderboardEntryDomain; place: PodiumPlace }[] {
  const top = (ranked ?? []).slice(0, LEADERBOARD_PODIUM_MAX);
  const n = top.length;
  if (n === 0) return [];
  if (n === 1) return [{ entry: top[0], place: 1 }];
  if (n === 2) {
    return [
      { entry: top[1], place: 2 },
      { entry: top[0], place: 1 },
    ];
  }
  if (n === 3) {
    return [
      { entry: top[1], place: 2 },
      { entry: top[0], place: 1 },
      { entry: top[2], place: 3 },
    ];
  }
  if (n === 4) {
    return [
      { entry: top[3], place: 4 },
      { entry: top[1], place: 2 },
      { entry: top[0], place: 1 },
      { entry: top[2], place: 3 },
    ];
  }
  return [
    { entry: top[4], place: 5 },
    { entry: top[3], place: 4 },
    { entry: top[1], place: 2 },
    { entry: top[0], place: 1 },
    { entry: top[2], place: 3 },
  ];
}

const barHeights: Record<PodiumPlace, string> = {
  1: "min-h-[11rem] sm:min-h-[12.5rem]",
  2: "min-h-[8.75rem] sm:min-h-[10rem]",
  3: "min-h-[7.25rem] sm:min-h-[8.25rem]",
  4: "min-h-[6rem] sm:min-h-[7rem]",
  5: "min-h-[5.25rem] sm:min-h-[6.25rem]",
};

const barSurfaces: Record<PodiumPlace, string> = {
  1: "bg-violet-600 text-white",
  2: "bg-violet-500 text-white dark:bg-violet-500",
  3: "bg-violet-300 text-violet-950 dark:bg-violet-400 dark:text-violet-950",
  4: "bg-violet-200 text-violet-950 dark:bg-violet-300/90 dark:text-violet-950",
  5: "bg-violet-100 text-violet-950 dark:bg-violet-300/70 dark:text-violet-950",
};

function listAriaLabel(slotCount: number) {
  if (slotCount <= 0) return "";
  if (slotCount === 1) return "Primeiro colocado no pódio";
  if (slotCount === 2) return "Pódio com os dois primeiros colocados";
  if (slotCount === 3) return "Pódio com os três primeiros colocados";
  if (slotCount === 4) return "Pódio com os quatro primeiros colocados";
  return "Pódio com os cinco primeiros colocados";
}

function PodiumColumn({
  entry,
  place,
  metric,
  compact,
}: {
  entry: ReadingLeaderboardEntryDomain;
  place: PodiumPlace;
  metric: ReadingRankingMetric;
  compact: boolean;
}) {
  const primaryValue =
    metric === "pages"
      ? entry.totalPages.toLocaleString("pt-BR")
      : entry.booksRead.toLocaleString("pt-BR");
  const primaryUnit = metric === "pages" ? "páginas" : "livros";
  const PodiumIcon = place === 1 ? Trophy : Medal;
  const lightPodium = place >= 3;
  const iconMuted = lightPodium
    ? "text-violet-800 dark:text-violet-900"
    : "text-white";

  const avatarSize: ProfileInitialsAvatarSize = compact ? "md" : "lg";
  const iconClass = compact ? "size-7" : "size-8";

  const a11ySummary = `${place}º lugar, ${entry.displayName}, ${primaryValue} ${primaryUnit}`;

  return (
    <div
      role="listitem"
      aria-label={a11ySummary}
      className={cn(
        "flex min-w-0 flex-col items-center px-0.5 sm:px-1",
        compact ? "min-w-[4.25rem] flex-1 sm:min-w-0" : "flex-1",
      )}
    >
      <div className="relative mb-2">
        <ProfileInitialsAvatar
          initials={initialsFromDisplayName(entry.displayName)}
          size={avatarSize}
          className="ring-2 ring-violet-500 ring-offset-2 ring-offset-background dark:ring-violet-400"
        />
        <span
          className="absolute -bottom-1 -right-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-bold text-white shadow-sm dark:bg-rose-700"
          aria-hidden
        >
          {place}
        </span>
      </div>
      <p
        className={cn(
          "mb-2 text-center font-semibold tabular-nums text-zinc-600 dark:text-zinc-400",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {primaryValue}
        <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-500">
          {primaryUnit}
        </span>
      </p>
      <div
        className={cn(
          "flex w-full max-w-42 flex-col rounded-t-xl px-1.5 pb-3 pt-2.5 text-center shadow-sm sm:max-w-44 sm:px-2 sm:pb-4 sm:pt-3",
          compact && "max-w-36 sm:max-w-40",
          barHeights[place],
          barSurfaces[place],
        )}
      >
        <p
          className={cn(
            "line-clamp-3 wrap-break-word font-bold leading-snug",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {entry.displayName}
        </p>
        <div className="mt-auto flex justify-center pt-3 sm:pt-5">
          <PodiumIcon
            className={cn("shrink-0 opacity-95", iconClass, iconMuted)}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

/** Ordem visual do pódio de 5 colunas (esquerda → direita). */
const PODIUM_FIVE_VISUAL_PLACES: PodiumPlace[] = [5, 4, 2, 1, 3];

export function LeaderboardPodiumSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]",
        className,
      )}
      aria-hidden
    >
      <div className="flex min-w-[32rem] items-end justify-center gap-1 sm:min-w-0 md:w-full">
        {PODIUM_FIVE_VISUAL_PLACES.map((place) => (
          <div
            key={`podium-sk-${place}`}
            className="flex min-w-[4.25rem] flex-1 flex-col items-center"
          >
            <Skeleton className="mb-2 size-16 rounded-2xl" />
            <Skeleton className="mb-2 h-4 w-14" />
            <Skeleton
              className={cn("w-full max-w-36 rounded-t-xl", barHeights[place])}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type LeaderboardPodiumProps = {
  /** Ordenados por classificação (1º no índice 0). No máximo {@link LEADERBOARD_PODIUM_MAX} itens são usados. */
  entries: ReadingLeaderboardEntryDomain[];
  metric: ReadingRankingMetric;
  className?: string;
};

export function LeaderboardPodium({
  entries,
  metric,
  className,
}: LeaderboardPodiumProps) {
  const slots = buildPodiumSlots(entries);
  if (slots.length === 0) return null;

  const compact = slots.length >= 4;
  const scrollRow = slots.length >= 4;

  return (
    <div
      className={cn(
        scrollRow &&
          "overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      <div
        role="list"
        aria-label={listAriaLabel(slots.length)}
        className={cn(
          "flex items-end justify-center gap-0.5 sm:gap-1",
          scrollRow &&
            slots.length === 5 &&
            "w-max min-w-[32rem] md:min-w-0 md:w-full",
          scrollRow &&
            slots.length === 4 &&
            "w-max min-w-[28rem] md:min-w-0 md:w-full",
        )}
      >
        {slots.map(({ entry, place }) => (
          <PodiumColumn
            key={entry.readerId}
            entry={entry}
            place={place}
            metric={metric}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
