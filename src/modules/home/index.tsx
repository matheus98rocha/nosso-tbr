"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookDialog } from "@/modules/home/components/bookDialog/bookDialog";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import FiltersSheet, {
  FiltersOptions,
} from "./components/filtersSheet/filters";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookDomain } from "./types/books.types";
import { BookCard } from "./components/bookCard/bookCard";
import { LinkButton } from "@/components/linkButton/linkButton";

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
          <div className="flex items-center gap-2">
            <Button onClick={() => dialogModal.setIsOpen(true)}>
              Adicionar Livro
            </Button>
            {/* <Button asChild>
              <Link href="/bookshelves">Estantes</Link>
            </Button> */}
            <LinkButton href="/bookshelves" label="Estantes" />
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

          <ListGrid<BookDomain>
            items={allBooks ?? []}
            isLoading={isLoadingAllBooks}
            isFetched={isFetched}
            renderItem={(book) => <BookCard key={book.id} book={book} />}
          />
        </div>
      </main>
    </>
  );
}
