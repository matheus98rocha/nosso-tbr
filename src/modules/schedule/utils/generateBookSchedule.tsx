import { DailySchedule, ScheduleInput } from "../types/schedule.types";

export function generateBookSchedule({
  totalChapters,
  startDate,
  includePrologue,
  chaptersPerDay = 3,
  includeWeekends,
  includeEpilogue,
}: ScheduleInput & { days?: number }): DailySchedule[] {
  const schedule: DailySchedule[] = [];
  const chapters: number[] = [];

  for (let i = 1; i <= totalChapters; i++) {
    chapters.push(i);
  }

  const parsedDate = new Date(startDate);
  const currentDate = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
    12,
    0,
    0,
    0
  );

  let chapterIndex = 0;

  while (chapterIndex < chapters.length) {
    while (
      !includeWeekends &&
      (currentDate.getDay() === 0 || currentDate.getDay() === 6)
    ) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const scheduleDate = new Date(currentDate);

    const remaining = chapters.length - chapterIndex;
    const take = Math.min(chaptersPerDay, remaining);
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

    scheduleDate.setHours(12, 0, 0, 0);

    schedule.push({
      date: scheduleDate,
      chapters: parts.join(", "),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }
  return schedule;
}
