import { QUERY_KEYS } from "@/constants/keys";
import { StatsService } from "@/modules/stats/services/stats.service";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isUnauthorizedError } from "@/lib/api/isUnauthorizedError";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useReadingYears } from "@/hooks/useReadingYears";
import type { ReadingRankingMetric } from "@/modules/stats/types/stats.types";
import { buildRankedLeaderboard } from "@/modules/stats/utils/buildRankedLeaderboard";

const statsService = new StatsService();

export function useReadingRanking() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    undefined,
  );
  const [metric, setMetric] = useState<ReadingRankingMetric>("books");

  const yearKey = selectedYear ?? "all";

  const {
    data: baseRows,
    isLoading: isLoadingBaseRows,
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

  const ranked = useMemo(
    () => buildRankedLeaderboard(baseRows, metric),
    [baseRows, metric],
  );

  const { data: years, isLoading: isLoadingYears } = useReadingYears();

  const yearOptions = useMemo(() => years ?? [], [years]);
  const isLoading = useMemo(
    () => isLoadingBaseRows || isLoadingYears,
    [isLoadingBaseRows, isLoadingYears],
  );

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
