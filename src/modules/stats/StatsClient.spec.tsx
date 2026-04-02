import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatsClient } from "./index";
import type { EstatisticaAnual } from "@/modules/stats/types/stats.types";

vi.mock("@/modules/stats/_hooks/useStatsClient", () => ({
  STATS_CHART_PIE_FILLS: [
    "var(--a)",
    "var(--b)",
    "var(--c)",
    "var(--d)",
    "var(--e)",
  ],
  useStatsClient: vi.fn(),
}));

vi.mock("@/modules/stats/_components", () => ({
  ReadingRankingSection: () => <div data-testid="reading-ranking-section" />,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="recharts-mock">{children}</div>
  ),
  BarChart: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
}));

import { useStatsClient } from "@/modules/stats/_hooks/useStatsClient";

const yearlyStats: EstatisticaAnual[] = [
  {
    year: 2024,
    totalBooks: 3,
    totalPages: 900,
    mostReadGenre: "fiction",
    mostReadAuthor: "Author",
  },
];

describe("StatsClient", () => {
  beforeEach(() => {
    vi.mocked(useStatsClient).mockReturnValue({
      selectedReader: "Matheus",
      readerOptions: ["Matheus", "Fabi", "Barbara"],
      handleReaderChange: vi.fn(),
      totalPagesAcrossYears: 900,
      primaryYearMostReadGenre: "fiction",
      primaryYearMostReadAuthor: "Author",
      barChartAxisTickStyle: { fill: "var(--muted-foreground)", fontSize: 12 },
      chartGridStroke: "var(--border)",
      chartTooltipContentStyle: {
        backgroundColor: "var(--popover)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        color: "var(--popover-foreground)",
      },
      collaborationPieLabelFormatter: () => "",
      hasYearlyChartData: true,
      hasCollaborationChartData: true,
    });
  });

  it("renders KPI summary and charts section", () => {
    render(
      <StatsClient
        yearlyStats={yearlyStats}
        collaborators={[{ readerName: "Fabi", booksRead: 2 }]}
        totalBooks={5}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Resumo de leitura" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Gráficos" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("reading-ranking-section")).toBeInTheDocument();
  });
});
