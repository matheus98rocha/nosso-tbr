import { Status } from "@/types/books.types";
import { useMemo } from "react";

const PLANNED_FIELD_VISIBLE_STATUSES: Array<Status | null> = [
  null,
  "not_started",
  "planned",
];

export function usePlannedStartDateFieldVisibility({
  selectedStatus,
}: {
  selectedStatus: Status | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const shouldShowPlannedStartDate = useMemo(
    () => PLANNED_FIELD_VISIBLE_STATUSES.includes(selectedStatus),
    [selectedStatus],
  );

  return {
    shouldShowPlannedStartDate,
  };
}
