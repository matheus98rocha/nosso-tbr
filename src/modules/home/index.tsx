"use client";

import { Button } from "@/components/ui/button";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookDomain } from "../../types/books.types";
import { BookCard } from "./components/bookCard/bookCard";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves/createEditBookshelves";

import { useUserStore } from "@/stores/userStore";

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
    isMyBooksPage,
    handleGenerateReadersObj,
  } = useHome();

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
      <div className="w-full flex items-center justify-center flex-col gap-4 container">
        {!isLoadingAllBooks && (
          <div className="flex items-start justify-center flex-col container">
            <h4 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {isMyBooksPage ? "Meus livros" : "Resultados"}
            </h4>

            <p className="leading-7">
              Foram encontrados: <strong>{allBooks?.length || 0} livros</strong>
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
                        `${formattedGenres ? "," : ""} Leitor(s) ${
                          handleGenerateReadersObj().readersDisplay
                        }`}
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
          items={allBooks ?? []}
          isLoading={isLoadingAllBooks || isLoggingOut}
          isFetched={isFetched}
          renderItem={(book) => <BookCard key={book.id} book={book} />}
          isError={isError}
        />
      </div>
    </>
  );
}
