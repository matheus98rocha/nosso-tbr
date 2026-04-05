import { useReadingYears } from "@/hooks/useReadingYears";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { YearFilterChipsProps } from "../yearFilterChips.types";

export function useYearFilterChips({
  activeYear,
  onSelect,
  isLoading: isLoadingProps,
}: YearFilterChipsProps) {
  const yearSectionRef = useRef<HTMLDivElement>(null);
  const [canFetchYears, setCanFetchYears] = useState(false);

  useEffect(() => {
    const el = yearSectionRef.current;
    if (!el) {
      setCanFetchYears(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setCanFetchYears(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCanFetchYears(true);
        }
      },
      { rootMargin: "120px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { data: years, isLoading: isLoadingYears } = useReadingYears({
    enabled: canFetchYears,
  });

  const isLoading = useMemo(
    () => isLoadingProps || !canFetchYears || isLoadingYears,
    [isLoadingProps, canFetchYears, isLoadingYears],
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
      yearSectionRef,
    }),
    [handleSelect, isLoading, yearsList],
  );
}
