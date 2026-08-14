"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { memo } from "react";
import type { CommunityMemberFollowRowProps } from "@/modules/profile/communityMemberFollowRow/types/communityMemberFollowRow.types";

function CommunityMemberFollowRowComponent({
  memberId,
  displayName,
  email,
  isFollowing,
  isToggleBusy,
  onPress,
}: CommunityMemberFollowRowProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
      <Link
        href={`/profile/${memberId}`}
        className="min-w-0 text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 cursor-pointer"
      >
        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {displayName}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
          {email || "—"}
        </p>
      </Link>
      <Button
        type="button"
        variant={isFollowing ? "secondary" : "default"}
        className={cn(
          "h-11 min-w-[120px] shrink-0 rounded-xl cursor-pointer transition-colors duration-200",
          !isToggleBusy && "active:scale-[0.98] active:duration-100",
          isToggleBusy && "disabled:opacity-100",
        )}
        disabled={isToggleBusy}
        onClick={onPress}
        aria-busy={isToggleBusy}
        aria-label={
          isFollowing
            ? `Deixar de seguir ${displayName}`
            : `Seguir ${displayName}`
        }
        aria-pressed={isFollowing}
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

export default memo(CommunityMemberFollowRowComponent);
