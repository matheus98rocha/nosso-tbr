import { FiltersOptions } from "@/types/filters";
import { useEffect, useRef } from "react";

const hasChanged = <T,>(previous: T, current: T) =>
  JSON.stringify(previous) !== JSON.stringify(current);

export const useSyncLocalFilters = <T extends FiltersOptions | string>(
  externalFilters: T,
  isOpen: boolean,
  resetLocalFilters: (filters: T) => void
) => {
  const previousFiltersRef = useRef(externalFilters);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (!isOpen && wasOpenRef.current && hasChanged(previousFiltersRef.current, externalFilters)) {
      resetLocalFilters(externalFilters);
    }

    previousFiltersRef.current = externalFilters;
    wasOpenRef.current = isOpen;
  }, [externalFilters, isOpen, resetLocalFilters]);
};
