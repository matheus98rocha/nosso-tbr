"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/modules/profile/components";
import { initialsFromDisplayName } from "@/modules/profile/utils";

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
  const { countsLabel, currentlyReadingLabel } = formatCommunityMemberActivity({
    registeredCount,
    finishedCount,
    currentlyReadingTitle,
  });

  return (
    <div className="flex h-full flex-col gap-4 rounded-[1.35rem] border border-[color-mix(in_oklch,var(--reading-ink)_12%,transparent)] bg-white/85 p-4 shadow-[0_16px_40px_-28px_color-mix(in_oklch,var(--reading-ink)_55%,transparent)] dark:bg-zinc-950/55 sm:p-5 lg:flex-row lg:items-center">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver detalhes de ${displayName}`}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--reading-ink)] focus-visible:ring-offset-2"
      >
        <ProfileAvatar
          initials={initialsFromDisplayName(displayName)}
          avatarSeed={avatarSeed}
          size="sm"
          alt={`Avatar de ${displayName}`}
        />
        <span className="min-w-0 space-y-1.5">
          <span className="block truncate font-medium text-zinc-950 dark:text-zinc-50">
            {displayName}
          </span>
          <CommunityRelationMarks
            isFollowing={isFollowing}
            isFollower={isFollower}
          />
          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
            {countsLabel}
          </span>
          {currentlyReadingLabel ? (
            <span className="block truncate text-sm text-zinc-700 dark:text-zinc-300">
              {currentlyReadingLabel}
            </span>
          ) : null}
        </span>
      </button>
      <div
        className={cn(
          "grid gap-2",
          isFollower ? "grid-cols-2 lg:w-40 lg:grid-cols-1" : "grid-cols-1 lg:w-40",
        )}
      >
        <Button
          type="button"
          variant={isFollowing ? "secondary" : "default"}
          className={cn(
            "h-11 w-full cursor-pointer rounded-xl transition-colors duration-200",
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
            className="h-11 w-full cursor-pointer rounded-xl"
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
