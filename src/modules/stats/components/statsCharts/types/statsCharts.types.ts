import type { CSSProperties } from "react";
import type { PieLabelRenderProps } from "recharts";

import type {
  CollaborationStatsDomain,
  EstatisticaAnual,
} from "@/modules/stats/types/stats.types";

export type StatsChartsProps = {
  yearlyStats: EstatisticaAnual[];
  collaborators: CollaborationStatsDomain[];
  hasYearlyChartData: boolean;
  hasCollaborationChartData: boolean;
  barChartAxisTickStyle: { fill: string; fontSize: number };
  chartGridStroke: string;
  chartTooltipContentStyle: CSSProperties;
  collaborationPieLabelFormatter: (props: PieLabelRenderProps) => string;
};
