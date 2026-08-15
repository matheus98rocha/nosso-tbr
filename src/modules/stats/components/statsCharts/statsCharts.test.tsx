import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import StatsCharts from "./statsCharts";
import type { StatsChartsProps } from "./types/statsCharts.types";

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

const baseProps: StatsChartsProps = {
  yearlyStats: [{ year: 2024, totalBooks: 3, totalPages: 900, mostReadGenre: "fiction", mostReadAuthor: "Author" }],
  collaborators: [{ readerName: "John Doe", booksRead: 2 }],
  hasYearlyChartData: true,
  hasCollaborationChartData: true,
  barChartAxisTickStyle: { fill: "var(--muted-foreground)", fontSize: 12 },
  chartGridStroke: "var(--border)",
  chartTooltipContentStyle: {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    color: "var(--popover-foreground)",
  },
  collaborationPieLabelFormatter: () => "",
};

describe("StatsCharts", () => {
  it("renders charts region when data is available", () => {
    render(<StatsCharts {...baseProps} />);

    expect(
      screen.getByRole("region", { name: "Gráficos" }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("recharts-mock")).toHaveLength(2);
  });
});
