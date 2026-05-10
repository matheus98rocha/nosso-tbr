import type { ScheduleDomain } from "@/modules/schedule/types/schedule.types";

import type { CurrentScheduleChapterInfo } from "../types/collectiveReading.types";

function formatScheduleDateLabel(isoDate: string) {
  return isoDate.split("T")[0].split("-").reverse().join("/");
}

export function getCurrentScheduleChapterInfo(
  schedule: ScheduleDomain[] | undefined,
): CurrentScheduleChapterInfo | null {
  if (!schedule?.length) return null;
  const sorted = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
  const next = sorted.find((r) => !r.completed);
  if (next) {
    return {
      kind: "active",
      dateLabel: formatScheduleDateLabel(next.date),
      chaptersLabel: next.chapters,
    };
  }
  const last = sorted[sorted.length - 1];
  return {
    kind: "completed",
    lastDateLabel: formatScheduleDateLabel(last.date),
    lastChaptersLabel: last.chapters,
  };
}
