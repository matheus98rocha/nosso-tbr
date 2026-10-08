"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/modules/profile/components";
import { initialsFromDisplayName } from "@/modules/profile/utils";

import { shouldShowCommunityLibraryCounts } from "../../utils/communityRelation";
import { formatCommunityMemberActivity } from "../../utils/formatCommunityMemberActivity";
import CommunityRelationMarks from "../communityRelationMarks";
import type { CommunityMemberRowProps } from "./types/communityMemberRow.types";

function CommunityMemberRowComponent({
  displayName,
  avatarSeed,
  registeredCount,
  finishedCount,
  currentlyReadingTitle,
  isFollowing,
  isFollower,
  isToggleBusy,
  isRemoveBusy,
  onOpen,
  onToggleFollow,
  onRemoveFollower,
}: CommunityMemberRowProps) {
  const reduceMotion = useReducedMotion();
  const showLibraryCounts = shouldShowCommunityLibraryCounts({
    isFollowing,
    isFollower,
  });
  const { countsLabel, currentlyReadingLabel } = formatCommunityMemberActivity({
    registeredCount,
    finishedCount,
    currentlyReadingTitle,
  });

  return (
    <div className="flex h-full flex-col rounded-[1.35rem] border border-[color-mix(in_oklch,var(--reading-ink)_12%,transparent)] bg-white/85 p-4 shadow-[0_16px_40px_-28px_color-mix(in_oklch,var(--reading-ink)_55%,transparent)] dark:bg-zinc-950/55 sm:p-5">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver detalhes de ${displayName}`}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3.5 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--reading-ink)] focus-visible:ring-offset-2"
      >
        <ProfileAvatar
          initials={initialsFromDisplayName(displayName)}
          avatarSeed={avatarSeed}
          size="md"
          alt={`Avatar de ${displayName}`}
        />
        <span className="min-w-0 flex-1 space-y-2 pt-0.5">
          <span className="block truncate text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {displayName}
          </span>
          <CommunityRelationMarks
            isFollowing={isFollowing}
            isFollower={isFollower}
          />
          {currentlyReadingLabel ? (
            <span className="block truncate text-sm leading-snug text-zinc-700 dark:text-zinc-300">
              {currentlyReadingLabel}
            </span>
          ) : null}
          {showLibraryCounts ? (
            <span className="block truncate text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
              {countsLabel}
            </span>
          ) : null}
        </span>
      </button>
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant={isFollowing ? "secondary" : "default"}
          className={cn(
            "h-10 flex-1 cursor-pointer rounded-full transition-colors duration-200",
            !isToggleBusy && "active:scale-[0.98] active:duration-100",
            isToggleBusy && "disabled:opacity-100",
          )}
          disabled={isToggleBusy}
          onClick={onToggleFollow}
          aria-busy={isToggleBusy}
          aria-pressed={isFollowing}
          aria-label={
            isFollowing
              ? `Deixar de seguir ${displayName}`
              : `Seguir ${displayName}`
          }
        >
          <span className="relative flex min-h-5 items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isFollowing ? "following" : "follow"}
                initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.16,
                  ease: [0.33, 1, 0.68, 1],
                }}
                className="inline-block will-change-transform motion-reduce:transition-none"
              >
                {isFollowing ? "Seguindo" : "Seguir"}
              </motion.span>
            </AnimatePresence>
          </span>
        </Button>
        {isFollower ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 cursor-pointer rounded-full"
            disabled={isRemoveBusy}
            onClick={onRemoveFollower}
            aria-busy={isRemoveBusy}
            aria-label={`Remover ${displayName} dos seguidores`}
          >
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default memo(CommunityMemberRowComponent);
