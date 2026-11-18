import type { Status } from "@/types/books.types";

import type { ReviewStatusPresentation } from "../types";

const PRESENTATION: Record<Status, ReviewStatusPresentation> = {
  finished: {
    label: "Concluiu a leitura",
    badgeClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dotClassName: "bg-emerald-500",
  },
  reading: {
    label: "Leu parcialmente (lendo)",
    badgeClassName:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    dotClassName: "bg-amber-500",
  },
  paused: {
    label: "Pausou a leitura",
    badgeClassName:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    dotClassName: "bg-violet-500",
  },
  abandoned: {
    label: "Abandonou a obra",
    badgeClassName:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    dotClassName: "bg-rose-500",
  },
  not_started: {
    label: "Ainda não começou",
    badgeClassName:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    dotClassName: "bg-blue-500",
  },
  planned: {
    label: "Ainda não começou",
    badgeClassName:
      "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    dotClassName: "bg-blue-500",
  },
};

export function reviewStatusLabel(status: string): ReviewStatusPresentation {
  if (status in PRESENTATION) {
    return PRESENTATION[status as Status];
  }
  return PRESENTATION.not_started;
}
