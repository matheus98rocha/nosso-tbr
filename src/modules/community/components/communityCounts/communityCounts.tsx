"use client";

import { Users } from "lucide-react";
import { memo } from "react";

import { cn } from "@/lib/utils";

import type { CommunityCountsProps } from "./types/communityCounts.types";

function CommunityCountsComponent({
  followingCount,
  followerCount,
  activeView,
  onSelectView,
}: CommunityCountsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onSelectView("seguindo")}
        aria-pressed={activeView === "seguindo"}
        className={cn(
          "min-h-11 cursor-pointer rounded-2xl border px-4 py-3 text-left transition-colors",
          activeView === "seguindo"
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900",
        )}
      >
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest opacity-70">
          <Users className="size-3.5" aria-hidden />
          Seguindo
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {followingCount}
        </p>
      </button>
      <button
        type="button"
        onClick={() => onSelectView("seguidores")}
        aria-pressed={activeView === "seguidores"}
        className={cn(
          "min-h-11 cursor-pointer rounded-2xl border px-4 py-3 text-left transition-colors",
          activeView === "seguidores"
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900",
        )}
      >
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest opacity-70">
          <Users className="size-3.5" aria-hidden />
          Seguidores
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {followerCount}
        </p>
      </button>
    </div>
  );
}

export default memo(CommunityCountsComponent);
