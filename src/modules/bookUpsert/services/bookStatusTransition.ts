import { Status } from "@/types/books.types";
import { DateUtils } from "@/utils";

type NormalizeDatesForTransitionParams = {
  currentStatus?: Status;
  currentStartDate?: string | null;
  currentEndDate?: string | null;
  nextStatus?: Status;
  nextStartDate?: string | null;
  nextEndDate?: string | null;
  referenceDateIso?: string;
};

export function resolveFinishedEndDate(
  nextEndDate?: string | null,
  currentEndDate?: string | null,
  referenceDateIso = DateUtils.toISOString(new Date()),
): string {
  const resolved =
    nextEndDate ?? currentEndDate ?? referenceDateIso ?? DateUtils.toISOString(new Date());

  if (DateUtils.isValid(resolved)) {
    return DateUtils.toISOString(resolved);
  }

  return DateUtils.toISOString(new Date());
}

export function normalizeDatesForTransition({
  currentStatus,
  currentStartDate,
  currentEndDate,
  nextStatus,
  nextStartDate,
  nextEndDate,
  referenceDateIso = DateUtils.toISOString(new Date()),
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

  if (nextStatus === "finished") {
    return {
      start_date: nextStartDate ?? currentStartDate ?? null,
      end_date: resolveFinishedEndDate(
        nextEndDate,
        currentEndDate,
        referenceDateIso,
      ),
    };
  }

  return {
    start_date: nextStartDate ?? null,
    end_date: nextEndDate ?? null,
  };
}
