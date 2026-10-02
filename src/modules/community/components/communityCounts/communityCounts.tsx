"use client";

import { memo, useMemo } from "react";

import { cn } from "@/lib/utils";

import type { CommunityView } from "../../types/community.types";
import type { CommunityCountsProps } from "./types/communityCounts.types";

function CommunityCountsComponent({
  followingCount,
  followerCount,
  mutualCount,
  activeView,
  onSelectView,
}: CommunityCountsProps) {
  const items = useMemo(
    () =>
      [
        { view: "seguindo", label: "Seguindo", count: followingCount },
        { view: "seguidores", label: "Seguidores", count: followerCount },
        { view: "mutuos", label: "Mútuos", count: mutualCount },
      ] as const satisfies ReadonlyArray<{
        view: CommunityView;
        label: string;
        count: number;
      }>,
    [followerCount, followingCount, mutualCount],
  );

  return (
    <div className="grid w-full grid-cols-3 gap-2 lg:max-w-md">
      {items.map((item) => {
        const selected = activeView === item.view;

        return (
          <button
            key={item.view}
            type="button"
            onClick={() => onSelectView(item.view)}
            aria-pressed={selected}
            className={cn(
              "min-h-16 cursor-pointer rounded-2xl border px-2 py-2.5 text-left transition-colors sm:px-3",
              selected
                ? "border-transparent bg-[var(--reading-ink)] text-[var(--reading-surface)]"
                : "border-[color-mix(in_oklch,var(--reading-ink)_14%,transparent)] bg-white/70 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10",
            )}
          >
            <p
              className={cn(
                "text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] sm:tracking-[0.14em]",
                selected
                  ? "text-[color-mix(in_oklch,var(--reading-surface)_72%,transparent)]"
                  : "text-[color-mix(in_oklch,var(--reading-ink)_55%,transparent)]",
              )}
            >
              {item.label}
            </p>
            <p className="brand-display mt-1 text-2xl leading-none font-semibold tabular-nums sm:text-3xl">
              {item.count}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export default memo(CommunityCountsComponent);
