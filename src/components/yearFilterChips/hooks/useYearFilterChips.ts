import { useReadingYears } from "@/hooks/useReadingYears";
import { useCallback, useMemo } from "react";
import type { YearFilterChipsProps } from "../yearFilterChips.types";

export function useYearFilterChips({
  activeYear,
  onSelect,
  isLoading: isLoadingProps,
}: YearFilterChipsProps) {
  const { data: years, isLoading: isLoadingYears } = useReadingYears();

  const isLoading = useMemo(
    () => isLoadingYears || isLoadingProps,
    [isLoadingYears, isLoadingProps],
  );

  const yearsList = useMemo(() => years ?? [], [years]);

  const handleSelect = useCallback(
    (year: number) => {
      onSelect(activeYear === year ? undefined : year);
    },
    [activeYear, onSelect],
  );

  return useMemo(
    () => ({
      isLoading,
      yearsList,
      handleSelect,
    }),
    [handleSelect, isLoading, yearsList],
  );
}
