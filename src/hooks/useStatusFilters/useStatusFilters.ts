import { useCallback, useMemo } from "react";
import { FiltersOptions } from "@/types/filters";
import { Status } from "@/types/books.types";

type UseStatusFiltersProps = {
  filters: FiltersOptions;
  searchQuery: string;
  updateUrlWithFilters: (filters: FiltersOptions, search?: string) => void;
};

export default function useStatusFilters({
  filters,
  searchQuery,
  updateUrlWithFilters,
}: UseStatusFiltersProps) {
  const activeStatuses = useMemo(
    () => (filters.status ?? []) as Status[],
    [filters.status],
  );

  const handleToggleStatus = useCallback(
    (status: Status) => {
      const isActive = activeStatuses.includes(status);
      const updatedStatuses = isActive
        ? activeStatuses.filter((s) => s !== status)
        : [...activeStatuses, status];

      updateUrlWithFilters(
        { ...filters, status: updatedStatuses },
        searchQuery,
      );
    },
    [activeStatuses, filters, searchQuery, updateUrlWithFilters],
  );

  return { activeStatuses, handleToggleStatus };
}
