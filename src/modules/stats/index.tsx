"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getGenderLabel } from "@/constants/genders";
import { ReadingRankingSection } from "@/modules/stats/components";
import { useStatsClient } from "@/modules/stats/hooks/useStatsClient";
import type {
  KpiCardProps,
  StatsClientProps,
} from "@/modules/stats/types/stats.types";
import { BookOpen, FileText, PenLine, Tag } from "lucide-react";

const StatsCharts = dynamic(() => import("./components/statsCharts"), {
  loading: () => (
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8"
      aria-busy="true"
      aria-label="Carregando gráficos"
    >
      <Skeleton className="h-[min(320px,55vw)] min-h-[280px] w-full rounded-xl" />
      <Skeleton className="h-[min(320px,55vw)] min-h-[280px] w-full rounded-xl" />
    </div>
  ),
  ssr: false,
});

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
    totalPagesAcrossYears,
    primaryYearMostReadGenre,
    primaryYearMostReadAuthor,
    barChartAxisTickStyle,
    chartGridStroke,
    chartTooltipContentStyle,
    collaborationPieLabelFormatter,
    hasYearlyChartData,
    hasCollaborationChartData,
  } = useStatsClient({
    yearlyStats,
    collaborators,
  });

  return (
    <div className="space-y-10 md:space-y-12">
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

      <StatsCharts
        yearlyStats={yearlyStats}
        collaborators={collaborators}
        hasYearlyChartData={hasYearlyChartData}
        hasCollaborationChartData={hasCollaborationChartData}
        barChartAxisTickStyle={barChartAxisTickStyle}
        chartGridStroke={chartGridStroke}
        chartTooltipContentStyle={chartTooltipContentStyle}
        collaborationPieLabelFormatter={collaborationPieLabelFormatter}
      />

      <ReadingRankingSection />
    </div>
  );
});

export type {
  EstatisticaAnual,
  StatsClientProps,
} from "@/modules/stats/types/stats.types";
