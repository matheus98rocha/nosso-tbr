import { DailySchedule, ScheduleInput } from "../types/schedule.types";

export function generateBookSchedule({
  totalChapters,
  startDate,
  includePrologue = false,
  chaptersPerDay = 3,
  includeWeekends = true,
  includeEpilogue = true,
}: ScheduleInput): DailySchedule[] {
  const schedule: DailySchedule[] = [];
  const chapters: number[] = [];

  for (let i = 1; i <= totalChapters; i++) {
    chapters.push(i);
  }

  const currentDate = new Date(startDate);
  let chapterIndex = 0;

  while (chapterIndex < chapters.length) {
    if (!includeWeekends) {
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const remaining = chapters.length - chapterIndex;
    const take = Math.min(chaptersPerDay, remaining);
    const todayChapters = chapters.slice(chapterIndex, chapterIndex + take);
    chapterIndex += take;

    const parts: string[] = [];

    // prólogo só no primeiro dia
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

    // Epílogo colado no último grupo
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
