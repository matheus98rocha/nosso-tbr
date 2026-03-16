"use client";

import { Button } from "@/components/ui/button";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { useModal } from "@/hooks/useModal";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookDomain } from "../../types/books.types";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves/createEditBookshelves";
import { useUserStore } from "@/stores/userStore";
import { BookCard } from "../home/components/bookCard/bookCard";
import { useMyBooks } from "./hooks/useMyBooks";
import { Skeleton } from "@/components/ui/skeleton";
import DefaultPagination from "@/components/pagintation/pagination";
import { StatusFilterChips } from "@/modules/home/components/statusFilterChips/statusFilterChips";

export default function ClientMyBook() {
  const isLoggingOut = useUserStore((state) => state.isLoggingOut);

  const {
    allBooks,
    isFetched,
    isLoadingAllBooks,
    isError,
    searchQuery,
    formattedGenres,
    formattedReaders,
    formattedStatus,
    handleClearAllFilters,
    filters,
    hasSearchParams,
    currentPage,
    setCurrentPage,
    totalPages,
    activeStatuses,
    handleToggleStatus,
  } = useMyBooks();

  const dialogModal = useModal();
  const createShelfDialog = useModal();

  const isLoading = isLoadingAllBooks || isLoggingOut;

  const renderResultsCount = () => {
    if (isLoading) return <Skeleton className="h-6 w-48" />;
    return (
      <span>
        Foram encontrados: <strong>{allBooks?.total || 0} livros</strong>
      </span>
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

  const renderActiveFilters = () => {
    if (isLoading) return <Skeleton className="h-5 w-64 mt-2" />;

    const hasAnyFilter =
      formattedGenres || formattedReaders || formattedStatus || searchQuery;
    if (!hasAnyFilter) return null;

    return (
      <div className="leading-7 text-muted-foreground mt-2">
        {searchQuery && (
          <div>
            Buscando por: <strong>{searchQuery}</strong>
          </div>
        )}
        {(formattedGenres || formattedReaders || formattedStatus) && (
          <div>
            Filtros aplicados:
            {formattedGenres && ` gênero ${formattedGenres}`}
            {formattedReaders && `, leitor(s) ${formattedReaders}`}
            {formattedStatus && ` e com status ${formattedStatus}`}
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
      filters.status?.length > 0;

    if (isLoading || !canClear) return null;

    return (
      <Button variant="secondary" size="sm" onClick={handleClearAllFilters}>
        Limpar filtros
      </Button>
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

      <div className="w-full flex items-center justify-center flex-col gap-2 container">
        <div className="flex items-start justify-center flex-col container gap-3">
          <div className="leading-7">{renderResultsCount()}</div>
          {renderStatusChips()}
          <div className="flex items-center justify-center gap-4 min-h-[40px]">
            {renderActiveFilters()}
            {renderClearButton()}
          </div>
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
