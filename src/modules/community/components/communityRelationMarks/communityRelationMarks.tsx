"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

import { listCommunityRelationMarks } from "../../utils/communityRelation";
import type { CommunityRelationMarksProps } from "./types/communityRelationMarks.types";

const MARK_CLASS_NAME = {
  following:
    "border-[color-mix(in_oklch,var(--reading-ink)_24%,transparent)] bg-[color-mix(in_oklch,var(--reading-ink)_7%,transparent)] text-[var(--reading-ink)]",
  follower:
    "border-amber-800/20 bg-amber-100 text-amber-950 dark:border-amber-100/20 dark:bg-amber-200/15 dark:text-amber-50",
} as const;

function CommunityRelationMarksComponent({
  isFollowing,
  isFollower,
}: CommunityRelationMarksProps) {
  const marks = listCommunityRelationMarks({ isFollowing, isFollower });

  if (marks.length === 0) {
    return null;
  }

  return (
    <span className="flex flex-wrap gap-1.5">
      {marks.map((mark) => (
        <span
          key={mark.id}
          className={cn(
            "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold tracking-wide",
            MARK_CLASS_NAME[mark.id],
          )}
        >
          {mark.label}
        </span>
      ))}
    </span>
  );
}

export default memo(CommunityRelationMarksComponent);
