import { Status } from "@/types/books.types";
import { useMemo } from "react";

const DEFAULT_PLANNED_START_DATE_LABEL = "Previsão de Início da Leitura";
const PAUSED_PLANNED_START_DATE_LABEL = "Quando você quer retomar essa leitura?";
const ABANDONED_PLANNED_START_DATE_LABEL = "Quando você quer recomeçar esse livro?";

export function usePlannedStartDateLabel(selectedStatus: Status | null) {
  const plannedStartDateLabel = useMemo(() => {
    if (selectedStatus === "paused") {
      return PAUSED_PLANNED_START_DATE_LABEL;
    }

    if (selectedStatus === "abandoned") {
      return ABANDONED_PLANNED_START_DATE_LABEL;
    }

    return DEFAULT_PLANNED_START_DATE_LABEL;
  }, [selectedStatus]);

  return {
    plannedStartDateLabel,
  };
}

export const plannedStartDateLabels = {
  default: DEFAULT_PLANNED_START_DATE_LABEL,
  paused: PAUSED_PLANNED_START_DATE_LABEL,
  abandoned: ABANDONED_PLANNED_START_DATE_LABEL,
};
