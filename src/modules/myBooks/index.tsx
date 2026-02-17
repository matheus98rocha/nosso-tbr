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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  } = useMyBooks();

  const dialogModal = useModal();
  const createShelfDialog = useModal();

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
        {!isLoadingAllBooks && (
          <div className="flex items-start justify-center flex-col container">
            <p className="leading-7">
              Foram encontrados: <strong>{allBooks?.total || 0} livros</strong>
            </p>
            <div className="flex items-center justify-center gap-4">
              {(formattedGenres ||
                formattedReaders ||
                formattedStatus ||
                searchQuery) && (
                <p className="leading-7 text-muted-foreground mt-2">
                  {searchQuery && (
                    <>
                      Buscando por: <strong>{searchQuery}</strong>
                      {(formattedGenres ||
                        formattedReaders ||
                        formattedStatus) && <br />}
                    </>
                  )}

                  {(formattedGenres || formattedReaders || formattedStatus) && (
                    <>
                      Filtros aplicados:
                      {formattedGenres && ` gênero ${formattedGenres}`}
                      {formattedReaders &&
                        `${
                          formattedGenres ? "," : ""
                        } Leitor(s) ${formattedReaders}`}
                      {formattedStatus &&
                        `${
                          formattedGenres || formattedReaders ? " e" : ""
                        } com status ${formattedStatus}`}
                    </>
                  )}
                </p>
              )}

              {((searchQuery && hasSearchParams) ||
                (Array.isArray(filters.gender) && filters.gender.length > 0) ||
                (Array.isArray(filters.readers) &&
                  filters.readers.length > 0 &&
                  hasSearchParams) ||
                (Array.isArray(filters.status) &&
                  filters.status.length > 0)) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    handleClearAllFilters();
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        )}

        <ListGrid<BookDomain>
          items={allBooks?.data ?? []}
          isLoading={isLoadingAllBooks || isLoggingOut}
          isFetched={isFetched}
          renderItem={(book) => <BookCard key={book.id} book={book} />}
          isError={isError}
        />

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 0) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 0
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                >
                  Anterior
                </PaginationPrevious>
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, idx) => (
                <PaginationItem key={idx}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === idx}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(idx);
                    }}
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages - 1)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages - 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                >
                  Próximo
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  );
}
