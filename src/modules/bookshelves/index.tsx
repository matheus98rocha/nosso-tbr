"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowDownUp, ArrowLeft, GripVertical, Library } from "lucide-react";
import { useBookshelfBooks } from "./hooks/useBookshelfBooks";
import { useBookshelfBookOrder } from "./hooks/useBookshelfBookOrder";
import { useBookshelfMeta } from "./hooks/useBookshelfMeta";
import { useBookshelfSort } from "./hooks/useBookshelfSort";
import { SHELVES_LIST_PATH } from "@/lib/routes/shelves";
import { Skeleton } from "@/components/ui/skeleton";
import { SortFilterChips } from "@/components";
import BookshelfBooksSortableGrid from "./components/BookshelfBooksSortableGrid";

function ClientBookshelves() {
  const { id } = useParams();
  const bookshelfId = typeof id === "string" ? id : undefined;

  const {
    data: books = [],
    isLoading,
    isError,
    isSuccess,
    isFetched,
  } = useBookshelfBooks(bookshelfId);

  const { applyReorder, isPending: isReorderPending } =
    useBookshelfBookOrder(bookshelfId);

  const { sort, sortedBooks, isSortActive, handleSetSort } =
    useBookshelfSort(books);

  const {
    data: shelfMeta,
    isLoading: isLoadingShelfMeta,
    isError: isShelfMetaError,
  } = useBookshelfMeta(bookshelfId);

  if (!bookshelfId) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center"
        role="status"
        aria-live="polite"
      >
        <Library className="h-12 w-12 text-muted-foreground" aria-hidden />
        <p className="text-base text-muted-foreground">
          Não foi possível abrir esta estante. Volte e escolha outra estante.
        </p>
        <Link
          href={SHELVES_LIST_PATH}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-4 text-base font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Voltar para a lista de estantes"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={SHELVES_LIST_PATH}
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-md px-3 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Voltar para a lista de estantes"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
          Voltar
        </Link>
      </div>

      <header className="space-y-5 border-b border-border/60 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Livros na estante
            </p>
            {isLoadingShelfMeta ? (
              <Skeleton className="h-9 w-full max-w-md sm:h-10" aria-hidden />
            ) : shelfMeta?.name ? (
              <h1
                id="bookshelf-detail-name"
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                {shelfMeta.name}
              </h1>
            ) : isShelfMetaError ? null : (
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Estante
              </h1>
            )}
          </div>

          {isSortActive ? (
            <div className="flex max-w-sm items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/30 dark:text-violet-300 sm:max-w-xs">
              <ArrowDownUp
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden
              />
              <span>
                Ordenação ativa. Remova o filtro para reordenar manualmente.
              </span>
            </div>
          ) : (
            <div className="flex max-w-sm items-start gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground sm:max-w-xs">
              <GripVertical
                className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70"
                aria-hidden
              />
              <span>
                Arraste pela barra à esquerda de cada livro. A ordem fica salva
                nesta estante.
              </span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-4 space-y-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
              <ArrowDownUp size={11} aria-hidden />
              Ordenação
            </p>
            <SortFilterChips
              activeSort={sort}
              onSelect={handleSetSort}
              isLoading={isLoading}
            />
          </div>
        </div>
      </header>

      <BookshelfBooksSortableGrid
        shelfId={bookshelfId}
        books={sortedBooks}
        isLoading={isLoading}
        isFetched={isFetched && isSuccess}
        isError={isError}
        emptyMessage="Nenhum livro nesta estante. Adicione livros pela sua biblioteca ou pelas estantes."
        onReorder={applyReorder}
        reorderDisabled={isReorderPending || isSortActive}
      />
    </div>
  );
}

export default ClientBookshelves;
