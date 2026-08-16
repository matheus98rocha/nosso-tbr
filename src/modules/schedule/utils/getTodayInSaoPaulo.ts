import { DateUtils } from "@/utils/date";

const saoPauloDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getTodayInSaoPaulo(now: Date = new Date()): Date {
  const iso = saoPauloDateFormatter.format(now);
  const parsed = DateUtils.toDate(iso);
  if (parsed) {
    return parsed;
  }

  return DateUtils.createLocalDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
}
