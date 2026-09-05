"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  STATS_CHART_PIE_FILLS,
} from "@/modules/stats/hooks/useStatsClient";

import type { StatsChartsProps } from "./types/statsCharts.types";

function StatsChartsComponent({
  yearlyStats,
  collaborators,
  hasYearlyChartData,
  hasCollaborationChartData,
  barChartAxisTickStyle,
  chartGridStroke,
  chartTooltipContentStyle,
  collaborationPieLabelFormatter,
}: StatsChartsProps) {
  return (
    <section
      className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8"
      aria-label="Gráficos"
    >
      <Card className="shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg md:text-xl">Livros por ano</CardTitle>
          <CardDescription>
            Quantidade de livros concluídos em cada ano.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasYearlyChartData ? (
            <p className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
              Nenhum dado anual disponível para este leitor.
            </p>
          ) : (
            <div className="h-[min(320px,55vw)] w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearlyStats}
                  margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke={chartGridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
                    tick={barChartAxisTickStyle}
                    tickLine={false}
                    axisLine={{ stroke: chartGridStroke }}
                  />
                  <YAxis
                    tick={barChartAxisTickStyle}
                    tickLine={false}
                    axisLine={{ stroke: chartGridStroke }}
                    width={40}
                  />
                  <Tooltip contentStyle={chartTooltipContentStyle} />
                  <Legend />
                  <Bar
                    dataKey="totalBooks"
                    name="Livros lidos"
                    fill="var(--stats-chart-bar)"
                    radius={[6, 6, 0, 0]}
                    label={{
                      position: "top",
                      fill: "var(--foreground)",
                      fontSize: 12,
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg md:text-xl">
            Colaborações de leitura
          </CardTitle>
          <CardDescription>
            Distribuição de livros lidos com quem você se segue mutuamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasCollaborationChartData ? (
            <p className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
              Não há colaborações com leitores que se seguem mutuamente.
            </p>
          ) : (
            <div className="h-[min(320px,55vw)] w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collaborators}
                    dataKey="booksRead"
                    nameKey="readerName"
                    cx="50%"
                    cy="50%"
                    outerRadius="78%"
                    innerRadius="42%"
                    paddingAngle={2}
                    labelLine={false}
                    label={collaborationPieLabelFormatter}
                  >
                    {collaborators.map((entry, index) => (
                      <Cell
                        key={entry.readerName}
                        fill={
                          STATS_CHART_PIE_FILLS[
                            index % STATS_CHART_PIE_FILLS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipContentStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default memo(StatsChartsComponent);
