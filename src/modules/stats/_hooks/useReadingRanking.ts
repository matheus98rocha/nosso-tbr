import { QUERY_KEYS } from "@/constants/keys";
import { StatsService } from "@/modules/stats/services/stats.service";
import type { ReadingLeaderboardEntryDomain } from "@/modules/stats/types/stats.types";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isUnauthorizedError } from "@/lib/api/isUnauthorizedError";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const statsService = new StatsService();

const YEARS_TO_SHOW = 6;

export type ReadingRankingMetric = "books" | "pages";

export function useReadingRanking() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [metric, setMetric] = useState<ReadingRankingMetric>("books");

  const yearKey = selectedYear ?? "all";

  const {
    data: baseRows,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: QUERY_KEYS.stats.leaderboard(yearKey),
    queryFn: () => statsService.getReadingLeaderboard(selectedYear),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const ranked: ReadingLeaderboardEntryDomain[] = useMemo(() => {
    if (!baseRows?.length) return [];

    const sorted = [...baseRows].sort((a, b) => {
      if (metric === "pages") {
        const dp = b.totalPages - a.totalPages;
        if (dp !== 0) return dp;
        return b.booksRead - a.booksRead;
      }
      const db = b.booksRead - a.booksRead;
      if (db !== 0) return db;
      return b.totalPages - a.totalPages;
    });

    return sorted.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  }, [baseRows, metric]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: YEARS_TO_SHOW }, (_, i) => currentYear - i);
  }, []);

  const handleSelectYear = useCallback((year: number | undefined) => {
    setSelectedYear(year);
  }, []);

  const handleSetMetric = useCallback((next: ReadingRankingMetric) => {
    setMetric(next);
  }, []);

  useEffect(() => {
    if (!isError || !isUnauthorizedError(error)) return;

    toast("Sessão expirada", {
      description: "Faça login novamente para continuar.",
      className: "toast-error",
    });
    router.push("/auth");
  }, [error, isError, router]);

  return {
    ranked,
    selectedYear,
    yearOptions,
    metric,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    handleSelectYear,
    handleSetMetric,
  };
}
