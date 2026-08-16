import { DateUtils } from "@/utils/date";

import type {
  SchedulePaceDomain,
  SchedulePaceLabels,
  SchedulePaceStatus,
} from "../types/schedulePace.types";

const STATUS_LABEL: Record<SchedulePaceStatus, string> = {
  ahead: "Adiantado",
  behind: "Atrasado",
  on_time: "Em dia",
};

export function formatSchedulePaceLabels(
  pace: SchedulePaceDomain,
): SchedulePaceLabels {
  const dateText = DateUtils.formatForDisplay(pace.predictedEndDate);
  const caption = "Data prevista de término";
  const predictedEnd = `${caption}: ${dateText}`;
  const statusLabel = STATUS_LABEL[pace.status];
  const delay =
    pace.status === "behind"
      ? `Atraso de ${pace.overdueDays} ${pace.overdueDays === 1 ? "dia" : "dias"}`
      : null;
  const ariaLabel = delay
    ? `${predictedEnd}. ${delay}`
    : `${predictedEnd}. ${statusLabel}`;

  return {
    caption,
    dateText,
    predictedEnd,
    delay,
    statusLabel,
    ariaLabel,
  };
}
