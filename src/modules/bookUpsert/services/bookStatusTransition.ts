import { Status } from "@/types/books.types";

type NormalizeDatesForTransitionParams = {
  currentStatus?: Status;
  currentStartDate?: string | null;
  currentEndDate?: string | null;
  nextStatus?: Status;
  nextStartDate?: string | null;
  nextEndDate?: string | null;
};

export function normalizeDatesForTransition({
  currentStatus,
  currentStartDate,
  currentEndDate,
  nextStatus,
  nextStartDate,
  nextEndDate,
}: NormalizeDatesForTransitionParams) {
  if (nextStatus === "abandoned") {
    return {
      start_date: null,
      end_date: null,
    };
  }

  if (nextStatus === "paused") {
    return {
      start_date: currentStartDate ?? nextStartDate ?? null,
      end_date: currentEndDate ?? nextEndDate ?? null,
    };
  }

  if (currentStatus === "paused" && nextStatus === "reading") {
    return {
      start_date: nextStartDate ?? currentStartDate ?? null,
      end_date: null,
    };
  }

  if (currentStatus === "abandoned" && nextStatus === "reading") {
    return {
      start_date: nextStartDate ?? null,
      end_date: null,
    };
  }

  return {
    start_date: nextStartDate ?? null,
    end_date: nextEndDate ?? null,
  };
}
