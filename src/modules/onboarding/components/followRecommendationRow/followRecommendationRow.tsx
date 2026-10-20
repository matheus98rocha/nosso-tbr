"use client";

import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/modules/profile/components";
import { initialsFromDisplayName } from "@/modules/profile/utils";

import { formatFollowRecommendationReason } from "../../utils/rankFollowRecommendations";
import type { FollowRecommendationRowProps } from "./types/followRecommendationRow.types";

function FollowRecommendationRow({
  recommendation,
  isToggleBusy,
  onToggleFollow,
}: FollowRecommendationRowProps) {
  const reasonLabel = formatFollowRecommendationReason(recommendation.reason);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <ProfileAvatar
        initials={initialsFromDisplayName(recommendation.displayName)}
        avatarSeed={recommendation.avatarSeed}
        size="md"
        alt={`Avatar de ${recommendation.displayName}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
          {recommendation.displayName}
        </p>
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
          {reasonLabel}
        </p>
      </div>
      <Button
        type="button"
        className="h-11 min-w-24 shrink-0 cursor-pointer"
        disabled={isToggleBusy}
        aria-busy={isToggleBusy}
        aria-label={`Seguir ${recommendation.displayName}`}
        onClick={onToggleFollow}
      >
        Seguir
      </Button>
    </div>
  );
}

export default FollowRecommendationRow;
