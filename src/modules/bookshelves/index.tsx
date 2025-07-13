"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import { CreateEditBookshelves } from "./components/createEditBookshelves/createEditBookshelves";
import { useBookshelves } from "./hooks/useBookshelves";
import { ListGrid } from "../../components/listGrid/listGrid";
import { BookshelfDomain } from "./types/bookshelves.types";
import { AddBookToBookshelfDialog } from "./components/addBookToBookshelfDialog/addBookToBookshelfDialog";
import { LinkButton } from "@/components/linkButton/linkButton";

export type SelectedBookshelf = {
  id: string;
  name: string;
};

function ClientBookshelves() {
  const [isOpenCreateEdit, setOpenCreateEdit] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBookshelf, setSelectedBookshelf] = useState<SelectedBookshelf>(
    {
      id: "",
      name: "",
    }
  );

  const handleOpenDialog = (bookshelfId: SelectedBookshelf) => {
    setSelectedBookshelf(bookshelfId);
    setIsDialogOpen(true);
  };

  const { bookshelves, isFetching, isFetched } = useBookshelves({});

  return (
    <>
      <AddBookToBookshelfDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        bookshelfe={selectedBookshelf}
      />
      <CreateEditBookshelves
        isOpen={isOpenCreateEdit}
        handleClose={setOpenCreateEdit}
      />
      <div className="p-6 flex flex-col items-start gap-6">
        <Button onClick={() => setOpenCreateEdit(true)}>Criar Estante</Button>
        <ListGrid<BookshelfDomain>
          items={bookshelves ?? []}
          isLoading={isFetching}
          isFetched={isFetched}
          renderItem={(shelf) => (
            <Card className="w-full max-w-sm" key={shelf.id}>
              <CardHeader>
                <CardTitle>{shelf.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant={"outline"}
                  onClick={() =>
                    handleOpenDialog({
                      id: shelf.id,
                      name: shelf.name,
                    })
                  }
                >
                  Adicionar Livro a essa Estante
                </Button>
              </CardContent>
              <CardFooter>
                <LinkButton
                  href={`/bookshelvesBooks/${shelf.id}`}
                  label="Acessar Estante"
                />
              </CardFooter>
            </Card>
          )}
          emptyMessage="Nenhuma estante encontrada."
        />
      </div>
    </>
  );
}

export default ClientBookshelves;
