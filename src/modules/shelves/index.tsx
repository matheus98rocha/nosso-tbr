"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

  const [selectedBookshelf, setSelectedBookshelf] = useState<SelectedBookshelf>({
    id: "",
    name: "",
  });

  const handleOpenDialog = useCallback(
    (shelf: SelectedBookshelf) => {
      setSelectedBookshelf(shelf);
      dialog.setIsOpen(true);
    },
    [dialog.setIsOpen]
  );

  const { bookshelves, isFetching, isFetched } = useBookshelves({});

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

      <div className="w-full flex flex-col gap-6">
        {isLogged && (
          <div className="flex justify-end">
            <Button
              onClick={() => createEdit.setIsOpen(true)}
              className="min-h-[44px] gap-2 cursor-pointer transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              Criar Estante
            </Button>
          </div>
        )}

        <ListGrid<BookshelfDomain>
          items={bookshelves ?? []}
          isLoading={isFetching}
          isFetched={isFetched}
          renderItem={(shelf) => (
            <ShelfCard
              key={shelf.id}
              shelf={shelf}
              openAddBookDialog={() =>
                handleOpenDialog({ id: shelf.id, name: shelf.name })
              }
            />
          )}
          emptyMessage="Nenhuma estante encontrada."
        />
      </div>
    </>
  );
}

export default ClienteShelves;
