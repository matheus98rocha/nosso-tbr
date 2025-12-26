"use client";
import { Button } from "@/components/ui/button";

import React, { useState } from "react";
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
    }
  );

  const handleOpenDialog = (shelf: SelectedBookshelf) => {
    setSelectedBookshelf(shelf);
    dialog.setIsOpen(true);
  };

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
      <div className="p-6 flex flex-col items-start gap-6">
        {isLogged && (
          <Button onClick={() => createEdit.setIsOpen(true)}>
            Criar Estante
          </Button>
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
                handleOpenDialog({
                  id: shelf.id,
                  name: shelf.name,
                })
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
