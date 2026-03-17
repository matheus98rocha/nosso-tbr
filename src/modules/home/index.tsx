"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookDomain } from "../../types/books.types";
import { BookCard } from "./components/bookCard/bookCard";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves/createEditBookshelves";
import { useUserStore } from "@/stores/userStore";
import { Skeleton } from "@/components/ui/skeleton";
import DefaultPagination from "@/components/pagintation/pagination";
import { StatusFilterChips } from "./components/statusFilterChips/statusFilterChips";
import { YearFilterChips } from "./components/yearFilterChips/yearFilterChips";

const PAGE_SIZE = 10;

export default function ClientHome() {
  const isLoggingOut = useUserStore((state) => state.isLoggingOut);
  const {
    allBooks,
    isLoadingAllBooks,
    isFetched,
    isError,
    searchQuery,
    formattedGenres,
    formattedReaders,
    formattedStatus,
    formattedYear,
    handleClearAllFilters,
    filters,
    hasSearchParams,
    readersObj,
    currentPage,
    setCurrentPage,
    activeStatuses,
    handleToggleStatus,
    handleSetYear,
  } = useHome();

  const dialogModal = useModal();
  const createShelfDialog = useModal();

  const isLoading = isLoadingAllBooks || isLoggingOut;
  const totalPages = useMemo(
    () => Math.ceil((allBooks?.total || 0) / PAGE_SIZE),
    [allBooks?.total],
  );

  const renderResultsCount = () => {
    if (isLoading) return <Skeleton className="h-6 w-48" />;
    return (
      <span>
        Foram encontrados: <strong>{allBooks?.total || 0} livros</strong>
      </span>
    );
  };

  const renderActiveFilters = () => {
    if (isLoading) return <Skeleton className="h-5 w-64 mt-2" />;

    const hasAnyFilter =
      formattedGenres ||
      formattedReaders ||
      formattedStatus ||
      formattedYear ||
      searchQuery;
    if (!hasAnyFilter) return null;

    return (
      <div className="leading-7 text-muted-foreground ">
        {searchQuery && (
          <div>
            Buscando por: <strong>{searchQuery}</strong>
          </div>
        )}
        {(formattedGenres || formattedReaders || formattedStatus || formattedYear) && (
          <div>
            Filtros aplicados:
            {formattedGenres && ` gênero ${formattedGenres}`}
            {formattedReaders && `, leitor(s) ${readersObj.readersDisplay}`}
            {formattedStatus && ` e com status ${formattedStatus}`}
            {formattedYear && `, ano ${formattedYear}`}
          </div>
        )}
      </div>
    );
  };

  const renderClearButton = () => {
    const canClear =
      (searchQuery && hasSearchParams) ||
      filters.gender?.length > 0 ||
      (filters.readers?.length > 0 && hasSearchParams) ||
      filters.status?.length > 0 ||
      !!filters.year;

    if (isLoading || !canClear) return null;

    return (
      <Button variant="secondary" size="sm" onClick={handleClearAllFilters}>
        Limpar filtros
      </Button>
    );
  };

  const renderStatusChips = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      );
    }
    return (
      <StatusFilterChips
        activeStatuses={activeStatuses}
        onToggle={handleToggleStatus}
      />
    );
  };

  const renderYearChips = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      );
    }
    return (
      <YearFilterChips activeYear={filters.year} onSelect={handleSetYear} />
    );
  };

  return (
    <>
      <BookUpsert
        isBookFormOpen={dialogModal.isOpen}
        setIsBookFormOpen={dialogModal.setIsOpen}
      />
      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />

      <div className="w-full flex items-center justify-center flex-col container">
        <div className="flex items-start justify-center flex-col container gap-2 mb-4">
          <div className="leading-7">{renderResultsCount()}</div>
          <div className="flex items-center justify-center">
            {renderActiveFilters()}
            {renderClearButton()}
          </div>
          {renderStatusChips()}
          {renderYearChips()}
        </div>

        <ListGrid<BookDomain>
          items={allBooks?.data ?? []}
          isLoading={isLoading}
          isFetched={isFetched}
          renderItem={(book) => <BookCard key={book.id} book={book} />}
          isError={isError}
        />

        {!isLoading && totalPages > 1 && (
          <DefaultPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </>
  );
}
