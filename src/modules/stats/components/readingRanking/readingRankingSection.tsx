"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useReadingRanking } from "@/modules/stats/hooks/useReadingRanking";
import {
  LEADERBOARD_PODIUM_MAX,
  LeaderboardPodium,
  LeaderboardPodiumSkeleton,
} from "./leaderboardPodium";
import { ReadingRankingTable } from "./readingRankingTable";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Users,
} from "lucide-react";

function RankingTableSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={`rank-sk-${i}`} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ReadingRankingSection() {
  const {
    ranked,
    selectedYear,
    yearOptions,
    metric,
    isLoading,
    isError,
    refetch,
    handleSelectYear,
    handleSetMetric,
  } = useReadingRanking();

  const safeRanked = ranked ?? [];
  const podiumEntries = safeRanked.slice(0, LEADERBOARD_PODIUM_MAX);

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-zinc-50/50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30"
      aria-labelledby="reading-ranking-heading"
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="space-y-4 pb-2 sm:pb-4">
          <div className="space-y-1">
            <CardTitle
              id="reading-ranking-heading"
              className="text-xl font-bold tracking-tight text-foreground md:text-2xl"
            >
              Ranking de leitura
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Livros concluídos por leitor (com data de término). Classificação
              completa da comunidade; use os filtros para período e critério de
              ordenação.
            </CardDescription>
          </div>

          {!isLoading && safeRanked.length > 0 && (
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4 shrink-0" aria-hidden />
              <span>
                {safeRanked.length}{" "}
                {safeRanked.length === 1 ? "leitor" : "leitores"} no ranking
              </span>
            </p>
          )}

          <div className="flex flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex flex-col gap-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <CalendarDays size={11} aria-hidden />
                Período
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={selectedYear === undefined}
                  aria-label="Ranking de todo o período"
                  onClick={() => handleSelectYear(undefined)}
                  className={cn(
                    "min-h-11 cursor-pointer rounded-full px-4 text-xs font-medium transition-all sm:h-8 sm:min-h-0",
                    selectedYear === undefined
                      ? "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                      : "border-zinc-200 text-zinc-500 hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800",
                  )}
                >
                  Todo o período
                </Button>
                {yearOptions.map((year) => {
                  const isActive = selectedYear === year;
                  return (
                    <Button
                      key={year}
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-pressed={isActive}
                      aria-label={`Ranking do ano ${year}`}
                      onClick={() =>
                        handleSelectYear(isActive ? undefined : year)
                      }
                      className={cn(
                        "min-h-11 cursor-pointer rounded-full px-3 text-xs font-medium transition-all sm:h-8 sm:min-h-0",
                        isActive
                          ? "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                          : "border-zinc-200 text-zinc-500 hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800",
                      )}
                    >
                      {year}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <BarChart3 size={11} aria-hidden />
                Ordenar por
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={metric === "books"}
                  aria-label="Ordenar ranking por quantidade de livros"
                  onClick={() => handleSetMetric("books")}
                  className={cn(
                    "min-h-11 cursor-pointer gap-1.5 rounded-full px-4 text-xs font-medium transition-all sm:h-8 sm:min-h-0",
                    metric === "books"
                      ? "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                      : "border-zinc-200 text-zinc-500 hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800",
                  )}
                >
                  <BookOpen size={14} className="shrink-0" aria-hidden />
                  Livros
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={metric === "pages"}
                  aria-label="Ordenar ranking por quantidade de páginas"
                  onClick={() => handleSetMetric("pages")}
                  className={cn(
                    "min-h-11 cursor-pointer gap-1.5 rounded-full px-4 text-xs font-medium transition-all sm:h-8 sm:min-h-0",
                    metric === "pages"
                      ? "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                      : "border-zinc-200 text-zinc-500 hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800",
                  )}
                >
                  <FileText size={14} className="shrink-0" aria-hidden />
                  Páginas
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-6">
              <LeaderboardPodiumSkeleton />
              <RankingTableSkeleton />
            </div>
          ) : isError ? (
            <div
              className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center"
              role="alert"
            >
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar o ranking. Tente novamente.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 cursor-pointer transition-colors"
                onClick={() => refetch()}
                aria-label="Tentar carregar o ranking novamente"
              >
                Tentar de novo
              </Button>
            </div>
          ) : safeRanked.length === 0 ? (
            <p className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
              Nenhum livro concluído neste período para montar o ranking.
            </p>
          ) : (
            <div className="space-y-8">
              {podiumEntries.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Pódio
                  </h3>
                  <LeaderboardPodium entries={podiumEntries} metric={metric} />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Classificação completa
                </h3>
                <ReadingRankingTable
                  rows={safeRanked}
                  metric={metric}
                  expandOnPage
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
