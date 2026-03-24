import { Status } from "@/types/books.types";
import { useMemo } from "react";

export function usePlannedStartDateFieldVisibility({
  selectedStatus,
  startDate,
  endDate,
}: {
  selectedStatus: Status | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const shouldShowPlannedStartDate = useMemo(() => {
    if (selectedStatus === "paused" || selectedStatus === "abandoned") {
      return true;
    }

    return !startDate && !endDate;
  }, [selectedStatus, startDate, endDate]);

  return {
    shouldShowPlannedStartDate,
  };
}
