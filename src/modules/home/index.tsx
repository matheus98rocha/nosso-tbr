"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookDomain } from "../../types/books.types";
import { BookCard } from "@/components/bookCard/bookCard";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves/createEditBookshelves";
import { useUserStore } from "@/stores/userStore";
import { Skeleton } from "@/components/ui/skeleton";
import DefaultPagination from "@/components/pagintation/pagination";
import { StatusFilterChips } from "@/components/statusFilterChips/statusFilterChips";
import { YearFilterChips } from "@/components/yearFilterChips/yearFilterChips";

const PAGE_SIZE = 10;

export default function ClientHome() {
  const isLoggingOut = useUserStore((state) => state.isLoggingOut);
  const {
    allBooks,
    isLoadingAllBooks,
    isFetched,
    isError,
    handleClearAllFilters,
    filters,
    currentPage,
    setCurrentPage,
    activeStatuses,
    handleToggleStatus,
    handleSetYear,
    canClear,
    activeFilterLabels,
  } = useHome();

  const dialogModal = useModal();
  const createShelfDialog = useModal();
  const isLoading = isLoadingAllBooks || isLoggingOut;

  const totalPages = useMemo(
    () => Math.ceil((allBooks?.total || 0) / PAGE_SIZE),
    [allBooks?.total],
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-7">
      <BookUpsert
        isBookFormOpen={dialogModal.isOpen}
        setIsBookFormOpen={dialogModal.setIsOpen}
      />
      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />

      <header className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            {isLoading ? (
              <Skeleton className="h-full w-40" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {allBooks?.total || 0}
                </span>
                <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
                  livros encontrados
                </span>
              </div>
            )}

            {isLoading ? (
              <Skeleton className="h-4 w-56" />
            ) : activeFilterLabels.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 italic">
                <span>Filtrando por:</span>
                <span className="font-medium text-zinc-600 dark:text-zinc-300 not-italic">
                  {activeFilterLabels.join(" • ")}
                </span>
              </div>
            ) : null}
          </div>

          {!isLoading && canClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 self-start sm:self-auto"
            >
              Limpar tudo
            </Button>
          )}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {isLoading ? (
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          ) : (
            <StatusFilterChips
              activeStatuses={activeStatuses}
              onToggle={handleToggleStatus}
            />
          )}

          {isLoading ? (
            <div className="flex gap-2 flex-wrap border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16 rounded-full" />
              ))}
            </div>
          ) : (
            <YearFilterChips
              activeYear={filters.year}
              onSelect={handleSetYear}
            />
          )}
        </div>
      </header>

      <ListGrid<BookDomain>
        items={allBooks?.data ?? []}
        isLoading={isLoading}
        isFetched={isFetched}
        renderItem={(book) => <BookCard key={book.id} book={book} />}
        isError={isError}
      />

      {!isLoading && totalPages > 1 && (
        <div className="mt-10">
          <DefaultPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
