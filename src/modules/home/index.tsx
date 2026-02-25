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

const PAGE_SIZE = 8;

export default function ClientHome() {
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
    handleGenerateReadersObj,
    currentPage,
    setCurrentPage,
  } = useHome();

  const dialogModal = useModal();
  const createShelfDialog = useModal();

  const totalPages = useMemo(
    () => Math.ceil((allBooks?.total || 0) / PAGE_SIZE),
    [allBooks?.total],
  );

  const isLoading = isLoadingAllBooks || isLoggingOut;

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
        <div className="flex items-start justify-center flex-col container">
          <div className="leading-7">
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <span>
                Foram encontrados:{" "}
                <strong>{allBooks?.total || 0} livros</strong>
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 min-h-[40px]">
            {isLoading ? (
              <Skeleton className="h-5 w-64 mt-2" />
            ) : (
              (formattedGenres ||
                formattedReaders ||
                formattedStatus ||
                searchQuery) && (
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
                      {formattedReaders &&
                        `${formattedGenres ? "," : ""} Leitor(s) ${
                          handleGenerateReadersObj().readersDisplay
                        }`}
                      {formattedStatus &&
                        `${
                          formattedGenres || formattedReaders ? " e" : ""
                        } com status ${formattedStatus}`}
                    </div>
                  )}
                </div>
              )
            )}

            {!isLoading &&
              ((searchQuery && hasSearchParams) ||
                (Array.isArray(filters.gender) && filters.gender.length > 0) ||
                (Array.isArray(filters.readers) &&
                  filters.readers.length > 0 &&
                  hasSearchParams) ||
                (Array.isArray(filters.status) &&
                  filters.status.length > 0)) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearAllFilters}
                >
                  Limpar filtros
                </Button>
              )}
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
