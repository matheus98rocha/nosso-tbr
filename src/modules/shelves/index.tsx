"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookMarked, Plus } from "lucide-react";
import { CreateEditBookshelves } from "./components/createEditBookshelves/createEditBookshelves";
import { useBookshelves } from "./hooks/useBookshelves";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookshelfDomain, SelectedBookshelf } from "./types/bookshelves.types";
import { AddBookToBookshelfDialog } from "./components/addBookToBookshelfDialog/addBookToBookshelfDialog";
import { useModal } from "@/hooks/useModal";
import { ShelfCard } from "./components/shelfCard/shelfCard";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

function ClienteShelves() {
  const createEdit = useModal();
  const dialog = useModal();
  const isLogged = useIsLoggedIn();

  const [selectedBookshelf, setSelectedBookshelf] = useState<SelectedBookshelf>(
    {
      id: "",
      name: "",
    },
  );

  const handleOpenDialog = useCallback(
    (shelf: SelectedBookshelf) => {
      setSelectedBookshelf(shelf);
      dialog.setIsOpen(true);
    },
    [dialog],
  );

  const { bookshelves, isFetching, isFetched, isError } = useBookshelves({});

  return (
    <>
      <AddBookToBookshelfDialog
        isOpen={dialog.isOpen}
        onOpenChange={dialog.setIsOpen}
        bookshelfe={selectedBookshelf}
      />
      <CreateEditBookshelves
        isOpen={createEdit.isOpen}
        handleClose={createEdit.setIsOpen}
      />

      <div className="flex w-full flex-col gap-8">
        <Link
          href="/"
          className="group inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-md px-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />
          Voltar
        </Link>

        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookMarked
                className="h-5 w-5 shrink-0 text-primary"
                strokeWidth={1.5}
                aria-hidden
              />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Biblioteca pessoal
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Minhas estantes
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Organize seus livros em coleções personalizadas. Em cada card, use{" "}
              <span className="font-medium text-foreground">Acessar estante</span>{" "}
              para abrir a página com todos os livros daquela estante.
            </p>
          </div>

          {isLogged && (
            <Button
              type="button"
              onClick={() => createEdit.setIsOpen(true)}
              className="min-h-11 w-full shrink-0 gap-2 cursor-pointer transition-colors duration-200 sm:w-auto"
              aria-label="Criar nova estante"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Criar estante
            </Button>
          )}
        </header>

        <section
          className="flex flex-col gap-6"
          aria-labelledby="shelves-list-heading"
        >
          <h2 id="shelves-list-heading" className="sr-only">
            Lista de estantes
          </h2>
          <ListGrid<BookshelfDomain>
            items={bookshelves ?? []}
            isLoading={isFetching}
            isFetched={isFetched}
            isError={isError}
            renderItem={(shelf) => (
              <ShelfCard
                key={shelf.id}
                shelf={shelf}
                openAddBookDialog={() =>
                  handleOpenDialog({ id: shelf.id, name: shelf.name })
                }
              />
            )}
            emptyMessage="Nenhuma estante encontrada. Crie uma estante para começar a organizar seus livros."
          />
        </section>
      </div>
    </>
  );
}

export default ClienteShelves;
