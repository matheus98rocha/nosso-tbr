"use client";

import { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { getGenderLabel } from "@/constants/genders";
import { ReadingRankingSection } from "@/modules/stats/_components";
import {
  STATS_CHART_PIE_FILLS,
  useStatsClient,
} from "@/modules/stats/_hooks/useStatsClient";
import type { KpiCardProps, StatsClientProps } from "@/modules/stats/types/stats.types";
import { BookOpen, FileText, PenLine, Tag } from "lucide-react";

const KpiCard = memo(function KpiCard({ title, value, icon }: KpiCardProps) {
  return (
    <Card className="transition-shadow duration-300 hover:shadow-md">
      <CardContent className="flex flex-row items-center gap-4 pt-6">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary md:size-12"
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight md:text-3xl">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export const StatsClient = memo(function StatsClient({
  yearlyStats,
  collaborators,
  totalBooks,
}: StatsClientProps) {
  const {
    selectedReader,
    readerOptions,
    handleReaderChange,
    totalPagesAcrossYears,
    primaryYearMostReadGenre,
    primaryYearMostReadAuthor,
    barChartAxisTickStyle,
    chartGridStroke,
    chartTooltipContentStyle,
    collaborationPieLabelFormatter,
    hasYearlyChartData,
    hasCollaborationChartData,
  } = useStatsClient({ yearlyStats, collaborators });

  return (
    <div className="space-y-10 md:space-y-12">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label
            id="stats-reader-label"
            htmlFor="stats-reader"
            className="text-muted-foreground"
          >
            Leitor
          </Label>
          <Select value={selectedReader} onValueChange={handleReaderChange}>
            <SelectTrigger
              id="stats-reader"
              aria-labelledby="stats-reader-label"
              className="min-h-11 w-full min-w-[min(100%,16rem)] cursor-pointer transition-[box-shadow,colors] sm:w-56"
            >
              <SelectValue placeholder="Selecione um leitor" />
            </SelectTrigger>
            <SelectContent>
              {readerOptions.map((readerName) => (
                <SelectItem key={readerName} value={readerName}>
                  {readerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumo de leitura"
      >
        <KpiCard
          title="Total de livros"
          value={totalBooks}
          icon={<BookOpen className="size-5 md:size-6" strokeWidth={1.75} />}
        />
        <KpiCard
          title="Total de páginas"
          value={totalPagesAcrossYears}
          icon={<FileText className="size-5 md:size-6" strokeWidth={1.75} />}
        />
        <KpiCard
          title="Gênero mais lido"
          value={
            primaryYearMostReadGenre === "N/A" ? (
              <span className="text-xl text-muted-foreground md:text-2xl">
                N/A
              </span>
            ) : (
              getGenderLabel(primaryYearMostReadGenre)
            )
          }
          icon={<Tag className="size-5 md:size-6" strokeWidth={1.75} />}
        />
        <KpiCard
          title="Autor mais lido"
          value={
            <span className="line-clamp-2 text-xl md:text-2xl">
              {primaryYearMostReadAuthor}
            </span>
          }
          icon={<PenLine className="size-5 md:size-6" strokeWidth={1.75} />}
        />
      </section>

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
              Distribuição de livros lidos entre colaboradores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasCollaborationChartData ? (
              <p className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
                Não há outros leitores com dados de colaboração para exibir.
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

      <ReadingRankingSection />
    </div>
  );
});

export type { EstatisticaAnual, StatsClientProps } from "@/modules/stats/types/stats.types";
