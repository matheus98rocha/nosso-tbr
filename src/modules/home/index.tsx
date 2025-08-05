"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookDialog } from "@/components/bookDialog/bookDialog";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import FiltersSheet, {
  FiltersOptions,
} from "./components/filtersSheet/filters";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookDomain } from "../../types/books.types";
import { BookCard } from "./components/bookCard/bookCard";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves/createEditBookshelves";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useRouter } from "next/navigation";
import { genders } from "./utils/genderBook";

export default function ClientHome() {
  const router = useRouter();
  const [filters, setFilters] = useState<FiltersOptions>({
    readers: [],
    gender: [],
    status: [],
  });

  const statusDictionary = {
    finished: "Já iniciei a leitura",
    reading: "Terminei a Leitura",
    not_started: "Vou iniciar a leitura",
  };

  const dialogModal = useModal();
  const filtersSheet = useModal();
  const createShelfDialog = useModal();

  const { allBooks, isFetched, isLoadingAllBooks, isError } = useHome({
    filters,
  });

  const formatList = (items: string[]) => {
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} e ${items[1]}`;
    return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
  };

  const formattedGenres =
    Array.isArray(filters?.gender) && filters.gender.length > 0
      ? formatList(
          filters.gender.map(
            (value) => genders.find((g) => g.value === value)?.label ?? value
          )
        )
      : null;

  const formattedReaders =
    Array.isArray(filters?.readers) && filters.readers.length > 0
      ? formatList(filters.readers)
      : null;

  const formattedStatus =
    Array.isArray(filters?.status) && filters.status.length > 0
      ? formatList(
          filters.status.map(
            (value) =>
              `"${
                statusDictionary[value as keyof typeof statusDictionary] ??
                value
              }"`
          )
        )
      : null;

  return (
    <>
      <BookDialog
        isOpen={dialogModal.isOpen}
        onOpenChange={dialogModal.setIsOpen}
      />

      <FiltersSheet
        filters={filters}
        setFilters={setFilters}
        open={filtersSheet.isOpen}
        setIsOpen={filtersSheet.setIsOpen}
      />

      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />

      <main className="p-6 flex flex-col items-center gap-6">
        <header className="flex justify-between items-center container">
          <h1 className="text-2xl font-bold mb-4">Nosso TBR</h1>
          <div className="flex items-center gap-2">
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Livros</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={() => dialogModal.setIsOpen(true)}>
                    Adicionar Livro
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger>Estantes</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={() => router.push("/shelves")}>
                    Ver Estantes
                  </MenubarItem>
                  <MenubarItem
                    onClick={() => createShelfDialog.setIsOpen(true)}
                  >
                    Adicionar Estante
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </header>
        <div className="flex items-center justify-center flex-col gap-4 container">
          <div className="flex justify-end w-full">
            <Button
              variant="outline"
              onClick={() => filtersSheet.setIsOpen(true)}
            >
              Filtros
            </Button>
          </div>
          {!isLoadingAllBooks && (
            <div className="flex items-start justify-center flex-col container">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                Resultados
              </h3>

              <p className="leading-7">
                Foram encontrados: {allBooks?.length || 0} livros
              </p>

              {(formattedGenres || formattedReaders || formattedStatus) && (
                <p className="leading-7 text-muted-foreground mt-2">
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
                </p>
              )}
            </div>
          )}

          <ListGrid<BookDomain>
            items={allBooks ?? []}
            isLoading={isLoadingAllBooks}
            isFetched={isFetched}
            renderItem={(book) => <BookCard key={book.id} book={book} />}
            isError={isError}
          />
        </div>
      </main>
    </>
  );
}
