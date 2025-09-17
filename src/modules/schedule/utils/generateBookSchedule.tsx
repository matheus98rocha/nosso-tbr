import { DailySchedule, ScheduleInput } from "../types/schedule.types";

export function generateBookSchedule({
  totalChapters,
  startDate,
  includePrologue = false,
  chaptersPerDay = 3,
  includeWeekends = true,
  includeEpilogue = true,
  days,
}: ScheduleInput & { days?: number }): DailySchedule[] {
  const schedule: DailySchedule[] = [];
  const chapters: number[] = [];

  for (let i = 1; i <= totalChapters; i++) {
    chapters.push(i);
  }

  const currentDate = new Date(startDate);
  let chapterIndex = 0;

  let effectiveChaptersPerDay = chaptersPerDay;

  if (days && days > 0) {
    effectiveChaptersPerDay = Math.ceil(totalChapters / days);
  }

  while (chapterIndex < chapters.length) {
    if (!includeWeekends) {
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const remaining = chapters.length - chapterIndex;
    const take = Math.min(effectiveChaptersPerDay, remaining);
    const todayChapters = chapters.slice(chapterIndex, chapterIndex + take);
    chapterIndex += take;

    const parts: string[] = [];

    if (includePrologue && schedule.length === 0) {
      parts.push("Prólogo");
    }

    if (todayChapters.length > 0) {
      if (todayChapters.length === 1) {
        parts.push(`${todayChapters[0]}`);
      } else {
        parts.push(
          `${todayChapters[0]}-${todayChapters[todayChapters.length - 1]}`
        );
      }
    }

    if (includeEpilogue && chapterIndex >= chapters.length) {
      parts.push("Epílogo");
    }

    schedule.push({
      date: new Date(currentDate),
      chapters: parts.join(", "),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
}
