"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookDialog } from "@/modules/home/components/bookDialog/bookDialog";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import { BookList } from "./components/bookList/bookList";
import FiltersSheet, {
  FiltersOptions,
} from "./components/filtersSheet/filters";

export default function ClientHome() {
  const [filters, setFilters] = useState<FiltersOptions>({ readers: [] });

  const dialogModal = useModal();
  const filtersSheet = useModal();

  const { allBooks, isFetched, isLoadingAllBooks } = useHome({
    filters,
  });

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

      <main className="p-6 flex flex-col items-center gap-6">
        <header className="flex justify-between items-center container">
          <h1 className="text-2xl font-bold mb-4">Nosso TBR</h1>
          <Button onClick={() => dialogModal.setIsOpen(true)}>
            Adicionar Livro
          </Button>
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

          <BookList
            books={allBooks ?? []}
            isLoading={isLoadingAllBooks}
            isFetched={isFetched}
          />
        </div>
      </main>
    </>
  );
}
