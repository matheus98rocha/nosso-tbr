"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/modules/profile/components";
import { initialsFromDisplayName } from "@/modules/profile/utils";

import { formatCommunityMemberActivity } from "../../utils/formatCommunityMemberActivity";
import type { CommunityMemberRowProps } from "./types/communityMemberRow.types";

function CommunityMemberRowComponent({
  displayName,
  avatarSeed,
  registeredCount,
  finishedCount,
  currentlyReadingTitle,
  isFollowing,
  isToggleBusy,
  onOpen,
  onToggleFollow,
}: CommunityMemberRowProps) {
  const reduceMotion = useReducedMotion();
  const { countsLabel, currentlyReadingLabel } = formatCommunityMemberActivity({
    registeredCount,
    finishedCount,
    currentlyReadingTitle,
  });

  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver detalhes de ${displayName}`}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-100"
      >
        <ProfileAvatar
          initials={initialsFromDisplayName(displayName)}
          avatarSeed={avatarSeed}
          size="sm"
          alt={`Avatar de ${displayName}`}
        />
        <span className="min-w-0 space-y-1">
          <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
            {displayName}
          </span>
          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
            {countsLabel}
          </span>
          {currentlyReadingLabel ? (
            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
              {currentlyReadingLabel}
            </span>
          ) : null}
        </span>
      </button>
      <Button
        type="button"
        variant={isFollowing ? "secondary" : "default"}
        className={cn(
          "h-11 min-w-[120px] shrink-0 cursor-pointer rounded-xl transition-colors duration-200",
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
    </div>
  );
}

export default memo(CommunityMemberRowComponent);
