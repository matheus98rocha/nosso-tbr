import type { Status } from "@/types/books.types";

import type { CurrentBookStatusPresentation } from "../types";

const PRESENTATION: Record<Status, CurrentBookStatusPresentation> = {
  finished: {
    label: "Leitura finalizada",
    colorClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  reading: {
    label: "Lendo agora",
    colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  paused: {
    label: "Leitura pausada",
    colorClass:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    dotClass: "bg-violet-500",
  },
  abandoned: {
    label: "Livro abandonado",
    colorClass: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    dotClass: "bg-rose-500",
  },
  planned: {
    label: "Vou ler",
    colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  not_started: {
    label: "Vou ler",
    colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
};

export function currentBookStatus(status: string): CurrentBookStatusPresentation {
  if (status in PRESENTATION) {
    return PRESENTATION[status as Status];
  }
  return PRESENTATION.not_started;
}

export function reviewStarsAvailable(status: string) {
  return status === "finished";
}
