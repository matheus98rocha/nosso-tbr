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
  currentDate.setHours(currentDate.getHours() + 3);
  if (!currentDate) {
    throw new Error("Data inicial inválida");
  }

  currentDate.setHours(12, 0, 0, 0);

  let chapterIndex = 0;
  let effectiveChaptersPerDay = chaptersPerDay;

  if (days && days > 0) {
    effectiveChaptersPerDay = Math.ceil(totalChapters / days);
  }

  while (chapterIndex < chapters.length) {
    const scheduleDate = new Date(currentDate);

    if (!includeWeekends) {
      while (scheduleDate.getDay() === 0 || scheduleDate.getDay() === 6) {
        scheduleDate.setDate(scheduleDate.getDate() + 1);
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

    scheduleDate.setHours(12, 0, 0, 0);

    schedule.push({
      date: scheduleDate,
      chapters: parts.join(", "),
    });

    // Avança para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(
    "Cronograma gerado:",
    schedule.map((item) => ({
      date: item.date.toLocaleDateString("pt-BR"),
      time: item.date.getTime(),
      day: item.date.getDate(),
      month: item.date.getMonth() + 1,
      year: item.date.getFullYear(),
      chapters: item.chapters,
    }))
  );

  return schedule;
}
