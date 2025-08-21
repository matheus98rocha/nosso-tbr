type ScheduleInput = {
  totalChapters: number;
  startDate: Date;
  includePrologue?: boolean;
  chaptersPerDay?: number;
  includeWeekends?: boolean;
};

type DailySchedule = {
  date: Date;
  chapters: string;
};

export function generateBookSchedule({
  totalChapters,
  startDate,
  includePrologue = false,
  chaptersPerDay = 3,
  includeWeekends = true,
}: ScheduleInput): DailySchedule[] {
  const schedule: DailySchedule[] = [];
  const chapters: string[] = [];

  // Criar lista de capítulos sem contar o prólogo no índice
  for (let i = 1; i <= totalChapters; i++) {
    chapters.push(`Cap. ${i}`);
  }

  const currentDate = new Date(startDate);
  let chapterIndex = 0;

  while (chapterIndex < chapters.length) {
    // Pular fins de semana se não incluídos
    if (!includeWeekends) {
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Calcular quantos capítulos ler neste dia
    const remainingChapters = chapters.length - chapterIndex;
    const chaptersToday = Math.min(chaptersPerDay, remainingChapters);

    // Obter os capítulos deste dia
    const todayChapters = chapters.slice(
      chapterIndex,
      chapterIndex + chaptersToday
    );
    chapterIndex += chaptersToday;

    // Formatar a string de capítulos
    let chaptersText = "";

    // Adicionar prólogo apenas no primeiro dia
    if (includePrologue && schedule.length === 0) {
      chaptersText += "Prólogo";
      if (todayChapters.length > 0) chaptersText += ", ";
    }

    if (todayChapters.length > 0) {
      if (todayChapters.length === 1) {
        chaptersText += todayChapters[0];
      } else {
        const firstNum = todayChapters[0].replace("Cap. ", "");
        const lastNum = todayChapters[todayChapters.length - 1].replace(
          "Cap. ",
          ""
        );
        chaptersText += `Cap. ${firstNum}-${lastNum}`;
      }
    }

    schedule.push({
      date: new Date(currentDate),
      chapters: chaptersText,
    });

    // Avançar para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
}
