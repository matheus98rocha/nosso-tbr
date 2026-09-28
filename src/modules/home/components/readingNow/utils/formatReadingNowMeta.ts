export function formatReadingNowDaysLabel(daysReading: number | null): string | null {
  if (daysReading === null) return null;
  return daysReading === 1 ? "1º dia de leitura" : `${daysReading} dias lendo`;
}

export function formatReadingNowEmptyScheduleLabel(
  pages: number | null | undefined,
): string {
  if (typeof pages === "number" && pages > 0) {
    return `${pages} páginas · sem cronograma`;
  }
  return "Sem cronograma";
}
