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
import {
  useReadingRanking,
  type ReadingRankingMetric,
} from "@/modules/stats/_hooks/useReadingRanking";
import type { ReadingLeaderboardEntryDomain } from "@/modules/stats/types/stats.types";
import {
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Medal,
  Trophy,
  Users,
} from "lucide-react";

function RankingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={`rank-sk-${i}`} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

function PodiumCard({
  entry,
  place,
  metric,
}: {
  entry: ReadingLeaderboardEntryDomain;
  place: 1 | 2 | 3;
  metric: ReadingRankingMetric;
}) {
  const emphasis =
    place === 1
      ? "min-h-[9.5rem] border-primary/40 bg-primary/5 md:min-h-[10rem]"
      : place === 2
        ? "min-h-[8rem] border-border md:min-h-[8.5rem]"
        : "min-h-[7.5rem] border-border md:min-h-32";

  const PodiumIcon =
    place === 1 ? Trophy : place === 2 ? Medal : Award;

  const primary =
    metric === "pages"
      ? entry.totalPages.toLocaleString("pt-BR")
      : entry.booksRead.toLocaleString("pt-BR");
  const primaryLabel = metric === "pages" ? "páginas" : "livros";

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4",
        emphasis,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-xs">
          {place}º lugar
        </span>
        <PodiumIcon
          className={cn(
            "size-5 shrink-0",
            place === 1 ? "text-primary" : "text-muted-foreground",
          )}
          aria-hidden
        />
      </div>
      <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
        {entry.displayName}
      </p>
      <p className="mt-auto pt-2 text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
        {primary}
        <span className="ml-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
          {primaryLabel}
        </span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
        {metric === "pages"
          ? `${entry.booksRead.toLocaleString("pt-BR")} livros`
          : `${entry.totalPages.toLocaleString("pt-BR")} páginas`}
      </p>
    </div>
  );
}

function RankingTable({
  rows,
  metric,
}: {
  rows: ReadingLeaderboardEntryDomain[];
  metric: ReadingRankingMetric;
}) {
  const sortHint =
    metric === "pages"
      ? "Ordenado por páginas; colunas mostram os dois totais."
      : "Ordenado por livros; colunas mostram os dois totais.";

  return (
    <div
      className="relative max-h-[min(65vh,22rem)] overflow-x-auto overflow-y-auto overscroll-contain rounded-xl border border-border bg-card shadow-sm"
      role="region"
      aria-label="Demais posições no ranking, área rolável"
    >
      <table className="w-full min-w-[min(100%,20rem)] caption-bottom border-collapse text-left text-sm">
        <caption className="sr-only">
          Tabela de classificação a partir da quarta posição. {sortHint}
        </caption>
        <thead className="sticky top-0 z-10 border-b border-border bg-muted/95 backdrop-blur-sm">
          <tr>
            <th
              scope="col"
              className="w-12 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-3 sm:text-xs"
            >
              #
            </th>
            <th
              scope="col"
              className="min-w-24 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-3 sm:text-xs"
            >
              Leitor
            </th>
            <th
              scope="col"
              className="w-18 px-2 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:w-24 sm:px-3 sm:text-xs"
            >
              Livros
            </th>
            <th
              scope="col"
              className="w-18 px-2 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:w-24 sm:px-3 sm:text-xs"
            >
              Páginas
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((entry) => {
            const booksStrong = metric === "books";
            const pagesStrong = metric === "pages";
            return (
              <tr
                key={entry.readerId}
                className="transition-colors odd:bg-muted/20 hover:bg-muted/50"
              >
                <td className="px-2 py-2.5 align-middle tabular-nums text-muted-foreground sm:px-3">
                  {entry.rank}
                </td>
                <td className="max-w-48 px-2 py-2.5 align-middle font-medium text-foreground sm:max-w-none sm:px-3">
                  <span className="line-clamp-2 sm:line-clamp-1">
                    {entry.displayName}
                  </span>
                </td>
                <td
                  className={cn(
                    "px-2 py-2.5 text-right align-middle tabular-nums sm:px-3",
                    booksStrong
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {entry.booksRead.toLocaleString("pt-BR")}
                </td>
                <td
                  className={cn(
                    "px-2 py-2.5 text-right align-middle tabular-nums sm:px-3",
                    pagesStrong
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {entry.totalPages.toLocaleString("pt-BR")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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

  const topThree = ranked.slice(0, 3);
  const rest = ranked.slice(3);

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
              Livros concluídos por leitor (com data de término). Use os filtros
              para período e critério de ordenação; a tabela abaixo do pódio
              rola quando há muitas posições.
            </CardDescription>
          </div>

          {!isLoading && ranked.length > 0 && (
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4 shrink-0" aria-hidden />
              <span>
                {ranked.length}{" "}
                {ranked.length === 1 ? "leitor" : "leitores"} no ranking
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
            <RankingSkeleton />
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
          ) : ranked.length === 0 ? (
            <p className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
              Nenhum livro concluído neste período para montar o ranking.
            </p>
          ) : (
            <div className="space-y-6">
              {topThree.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Pódio
                  </h3>
                  <div
                    className={cn(
                      "grid gap-3 sm:gap-4",
                      topThree.length === 3
                        ? "grid-cols-1 md:grid-cols-3 md:items-end"
                        : topThree.length === 2
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1",
                    )}
                  >
                    {topThree.length === 3
                      ? ([1, 0, 2] as const).map((ti) => {
                          const e = topThree[ti];
                          const place = (ti + 1) as 1 | 2 | 3;
                          return (
                            <PodiumCard
                              key={e.readerId}
                              entry={e}
                              place={place}
                              metric={metric}
                            />
                          );
                        })
                      : topThree.map((e, i) => (
                          <PodiumCard
                            key={e.readerId}
                            entry={e}
                            place={(i + 1) as 1 | 2 | 3}
                            metric={metric}
                          />
                        ))}
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      Demais posições
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {rest.length}{" "}
                      {rest.length === 1 ? "posição" : "posições"} — role a
                      lista no quadro abaixo
                    </p>
                  </div>
                  <RankingTable rows={rest} metric={metric} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
