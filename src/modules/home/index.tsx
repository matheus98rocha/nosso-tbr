"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

  const { allBooks, isLoadingAllBooks, progress, isFetched } = useHome({
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

      <main className="p-6 flex flex-col items-center w-full gap-6">
        <header className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-bold mb-4">Nosso TBR</h1>
          <Button onClick={() => dialogModal.setIsOpen(true)}>
            Adicionar Livro
          </Button>
        </header>

        <div className="w-full flex justify-end container">
          <Button
            variant="outline"
            onClick={() => filtersSheet.setIsOpen(true)}
          >
            Filtros
          </Button>
        </div>

        <div>
          {isLoadingAllBooks ? (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <Progress value={progress} className="w-[60%] mb-4" />
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
