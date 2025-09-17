import { useEffect, useRef } from "react";
import { FiltersOptions } from "./useFiltersSheet";

export const useSyncLocalFilters = (
  externalFilters: FiltersOptions,
  isOpen: boolean,
  resetLocalFilters: (filters: FiltersOptions) => void
) => {
  const previousFiltersRef = useRef(externalFilters);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (
      !isOpen &&
      wasOpenRef.current &&
      JSON.stringify(previousFiltersRef.current) !==
        JSON.stringify(externalFilters)
    ) {
      resetLocalFilters(externalFilters);
    }

    previousFiltersRef.current = externalFilters;
    wasOpenRef.current = isOpen;
  }, [externalFilters, isOpen, resetLocalFilters]);
};
