"use client";

import { Button } from "@/components/ui/button";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookDomain } from "../../types/books.types";
import { BookCard } from "./components/bookCard/bookCard";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves/createEditBookshelves";

// import { Sliders } from "lucide-react";
// import { InputWithButton } from "@/components/inputWithButton/inputWithButton";

import { useUserStore } from "@/stores/userStore";
// import FiltersSheet from "./components/filtersSheet/filters";
// import { SearchBar } from "@/components/searchBar/searchBar";

export default function ClientHome() {
  const isLoggingOut = useUserStore((state) => state.isLoggingOut);

  const {
    allBooks,
    isFetched,
    isLoadingAllBooks,
    isError,
    isLoadingUser,
    searchQuery,
    // updateUrlWithFilters,
    formattedGenres,
    formattedReaders,
    formattedStatus,
    handleClearAllFilters,
    // handleInputBlur,
    // handleOnPressEnter,
    // handleSearchButtonClick,
    // inputRef,
    filters,
  } = useHome();

  const isMyBooksPage = !!filters.userId;

  const dialogModal = useModal();
  // const filtersSheet = useModal();
  const createShelfDialog = useModal();

  return (
    <>
      <BookUpsert
        isBookFormOpen={dialogModal.isOpen}
        setIsBookFormOpen={dialogModal.setIsOpen}
      />

      {/* <FiltersSheet
        filters={filters}
        open={filtersSheet.isOpen}
        setIsOpen={filtersSheet.setIsOpen}
        updateUrlWithFilters={updateUrlWithFilters}
        searchQuery={searchQuery}
      /> */}

      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />
      <div className="w-full flex items-center justify-center flex-col gap-4 container">
        {/* <div className="grid w-full mx-auto grid-cols-[1fr_auto] gap-2 items-center">
          <InputWithButton
            ref={inputRef}
            defaultValue={searchQuery}
            onBlur={handleInputBlur}
            onButtonClick={handleSearchButtonClick}
            placeholder="Pesquise por título do livro ou nome do autor"
            onKeyDown={handleOnPressEnter}
          />

          <Button
            variant="ghost"
            onClick={() => filtersSheet.setIsOpen(true)}
            className="border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
            aria-label="Filters"
          >
            <Sliders size={16} />
            Filtros
          </Button>
        </div> */}
        {/* <SearchBar
          ref={inputRef}
          searchQuery={searchQuery}
          onBlur={handleInputBlur}
          onSearchButtonClick={handleSearchButtonClick}
          onPressEnter={handleOnPressEnter}
          onOpenFilters={() => filtersSheet.setIsOpen(true)}
        /> */}
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

              {(searchQuery ||
                (Array.isArray(filters.gender) && filters.gender.length > 0) ||
                (Array.isArray(filters.readers) &&
                  filters.readers.length > 0) ||
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
          isLoading={isLoadingAllBooks || isLoadingUser || isLoggingOut}
          isFetched={isFetched}
          renderItem={(book) => <BookCard key={book.id} book={book} />}
          isError={isError}
        />
      </div>
    </>
  );
}
