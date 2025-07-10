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
import { Skeleton } from "@/components/ui/skeleton";

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
        <header className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-bold mb-4">Nosso TBR</h1>
          <Button onClick={() => dialogModal.setIsOpen(true)}>
            Adicionar Livro
          </Button>
        </header>
        <div className="flex items-center justify-center flex-col gap-4">
          <div className="flex justify-end container">
            <Button
              variant="outline"
              onClick={() => filtersSheet.setIsOpen(true)}
            >
              Filtros
            </Button>
          </div>
          {isLoadingAllBooks ? (
            <div className="container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-[327px] w-[327px] rounded-xl bg-primary opacity-40"
                />
              ))}
            </div>
          ) : (
            <>
              {isFetched && allBooks?.length === 0 ? (
                <div className="text-gray-500 text-center mt-4">
                  Nenhum livro encontrado.
                </div>
              ) : (
                <BookList books={allBooks ?? []} />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
