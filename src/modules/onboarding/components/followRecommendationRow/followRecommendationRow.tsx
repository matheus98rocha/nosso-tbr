"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/modules/profile/components";
import { initialsFromDisplayName } from "@/modules/profile/utils";

import { formatFollowRecommendationReason } from "../../utils/rankFollowRecommendations";
import type { FollowRecommendationRowProps } from "./types/followRecommendationRow.types";

function FollowRecommendationRow({
  recommendation,
  isToggleBusy,
  onToggleFollow,
  index = 0,
}: FollowRecommendationRowProps) {
  const reduceMotion = useReducedMotion();
  const reasonLabel = formatFollowRecommendationReason(recommendation.reason);
  const orderLabel = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: reduceMotion ? 0 : 0.08 + index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[color-mix(in_oklch,var(--reading-ink)_12%,transparent)] py-3.5 last:border-b-0 sm:gap-4",
      )}
    >
      <span
        className="brand-display w-7 text-sm tabular-nums text-[color-mix(in_oklch,var(--reading-ink)_38%,transparent)]"
        aria-hidden
      >
        {orderLabel}
      </span>
      <div className="flex min-w-0 items-center gap-3">
        <ProfileAvatar
          initials={initialsFromDisplayName(recommendation.displayName)}
          avatarSeed={recommendation.avatarSeed}
          size="md"
          alt={`Avatar de ${recommendation.displayName}`}
        />
        <div className="min-w-0 flex-1">
          <p className="brand-display truncate text-base font-semibold tracking-tight text-[var(--reading-ink)]">
            {recommendation.displayName}
          </p>
          <p className="truncate text-sm italic leading-snug text-[color-mix(in_oklch,var(--reading-ink)_58%,transparent)]">
            {reasonLabel}
          </p>
        </div>
      </div>
      <Button
        type="button"
        className={cn(
          "h-11 min-w-[5.75rem] shrink-0 cursor-pointer rounded-full bg-[var(--reading-ink)] text-[var(--reading-surface)] transition-[transform,opacity] hover:opacity-90",
          !isToggleBusy && "active:scale-[0.98]",
        )}
        disabled={isToggleBusy}
        aria-busy={isToggleBusy}
        aria-label={`Seguir ${recommendation.displayName}`}
        onClick={onToggleFollow}
      >
        Seguir
      </Button>
    </motion.div>
  );
}

export default FollowRecommendationRow;
