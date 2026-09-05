"use client";

import { useCallback, useMemo } from "react";
import type { PieLabelRenderProps } from "recharts";

import type {
  CollaborationStatsDomain,
  EstatisticaAnual,
} from "@/modules/stats/types/stats.types";

export const STATS_CHART_PIE_FILLS = [
  "var(--stats-chart-pie-1)",
  "var(--stats-chart-pie-2)",
  "var(--stats-chart-pie-3)",
  "var(--stats-chart-pie-4)",
  "var(--stats-chart-pie-5)",
] as const;

export type UseStatsClientArgs = {
  yearlyStats: EstatisticaAnual[];
  collaborators: CollaborationStatsDomain[];
};

export function useStatsClient({
  yearlyStats,
  collaborators,
}: UseStatsClientArgs) {
  const totalPagesAcrossYears = useMemo(
    () => yearlyStats.reduce((acc, row) => acc + (row.totalPages ?? 0), 0),
    [yearlyStats],
  );

  const primaryYearMostReadGenre = useMemo(
    () => yearlyStats[0]?.mostReadGenre ?? "N/A",
    [yearlyStats],
  );

  const primaryYearMostReadAuthor = useMemo(
    () => yearlyStats[0]?.mostReadAuthor ?? "N/A",
    [yearlyStats],
  );

  const barChartAxisTickStyle = useMemo(
    () => ({ fill: "var(--muted-foreground)", fontSize: 12 }),
    [],
  );

  const chartGridStroke = useMemo(() => "var(--border)", []);

  const chartTooltipContentStyle = useMemo(
    () => ({
      backgroundColor: "var(--popover)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      color: "var(--popover-foreground)",
    }),
    [],
  );

  const collaborationPieLabelFormatter = useCallback(
    (props: PieLabelRenderProps) => {
      const percentageRounded = Math.round((props.percent ?? 0) * 100);
      return `${props.name ?? ""} (${percentageRounded}%)`;
    },
    [],
  );

  const hasYearlyChartData = useMemo(
    () => yearlyStats.length > 0,
    [yearlyStats],
  );

  const hasCollaborationChartData = useMemo(
    () => collaborators.length > 0,
    [collaborators],
  );

  return useMemo(
    () => ({
      totalPagesAcrossYears,
      primaryYearMostReadGenre,
      primaryYearMostReadAuthor,
      barChartAxisTickStyle,
      chartGridStroke,
      chartTooltipContentStyle,
      collaborationPieLabelFormatter,
      hasYearlyChartData,
      hasCollaborationChartData,
    }),
    [
      totalPagesAcrossYears,
      primaryYearMostReadGenre,
      primaryYearMostReadAuthor,
      barChartAxisTickStyle,
      chartGridStroke,
      chartTooltipContentStyle,
      collaborationPieLabelFormatter,
      hasYearlyChartData,
      hasCollaborationChartData,
    ],
  );
}
