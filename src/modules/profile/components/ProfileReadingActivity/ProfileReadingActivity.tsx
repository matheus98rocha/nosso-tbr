"use client";

import { BookOpen } from "lucide-react";
import { memo } from "react";

import { formatCommunityMemberActivity } from "@/modules/community/utils/formatCommunityMemberActivity";

import type { ProfileReadingActivityProps } from "./types/profileReadingActivity.types";

function ProfileReadingActivityComponent({
  registeredCount,
  finishedCount,
  currentlyReadingTitle,
  isLoading = false,
  isError = false,
}: ProfileReadingActivityProps) {
  if (isLoading) {
    return (
      <div
        className="h-16 animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/50"
        aria-hidden
      />
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Não foi possível carregar a atividade de leitura. Tente de novo em
        instantes.
      </p>
    );
  }

  const activity = formatCommunityMemberActivity({
    registeredCount,
    finishedCount,
    currentlyReadingTitle,
  });

  return (
    <section
      className="space-y-2"
      aria-labelledby="profile-reading-activity-heading"
    >
      <h2
        id="profile-reading-activity-heading"
        className="inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
      >
        <BookOpen className="size-5 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
        Atividade de leitura
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {activity.countsLabel}
      </p>
      {activity.currentlyReadingLabel ? (
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {activity.currentlyReadingLabel}
        </p>
      ) : null}
    </section>
  );
}

export default memo(ProfileReadingActivityComponent);
