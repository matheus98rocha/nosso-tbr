"use client";

import { cn } from "@/lib/utils";
import type { ReadingRankingMetric } from "@/modules/stats/_hooks/useReadingRanking";
import type { ReadingLeaderboardEntryDomain } from "@/modules/stats/types/stats.types";

export type ReadingRankingTableProps = {
  rows: ReadingLeaderboardEntryDomain[];
  metric: ReadingRankingMetric;
  /** When true, table grows with content (page scroll). When false, max height + internal scroll. */
  expandOnPage?: boolean;
};

export function ReadingRankingTable({
  rows,
  metric,
  expandOnPage = true,
}: ReadingRankingTableProps) {
  const sortHint =
    metric === "pages"
      ? "Ordenado por páginas; colunas mostram os dois totais."
      : "Ordenado por livros; colunas mostram os dois totais.";

  return (
    <div
      className={cn(
        "relative overflow-x-auto overscroll-contain rounded-xl border border-border bg-card shadow-sm",
        expandOnPage ? "" : "max-h-[min(65vh,22rem)] overflow-y-auto",
      )}
      role="region"
      aria-label="Classificação completa do ranking"
    >
      <table className="w-full min-w-[min(100%,20rem)] caption-bottom border-collapse text-left text-sm">
        <caption className="sr-only">
          Classificação completa. {sortHint}
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
