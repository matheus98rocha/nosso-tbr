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

function ClienteShelves() {
  const createEdit = useModal();
  const dialog = useModal();

  const [selectedBookshelf, setSelectedBookshelf] = useState<SelectedBookshelf>(
    {
      id: "",
      name: "",
      owner: "",
    }
  );

  const handleOpenDialog = (bookshelfId: SelectedBookshelf) => {
    setSelectedBookshelf(bookshelfId);
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
        <Button onClick={() => createEdit.setIsOpen(true)}>
          Criar Estante
        </Button>
        <ListGrid<BookshelfDomain>
          items={bookshelves ?? []}
          isLoading={isFetching}
          isFetched={isFetched}
          renderItem={(shelf) => (
            <ShelfCard
              key={shelf.id}
              shelf={shelf}
              openAddBookDialog={handleOpenDialog}
            />
          )}
          emptyMessage="Nenhuma estante encontrada."
        />
      </div>
    </>
  );
}

export default ClienteShelves;
