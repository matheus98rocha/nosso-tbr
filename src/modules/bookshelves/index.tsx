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

function ClientBookshelves() {
  const [isOpenCreateEdit, setOpenCreateEdit] = useState(false);

  const { bookshelves, isFetching, isFetched } = useBookshelves({});

  return (
    <>
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
                {/* <div className="flex items-center justify-between gap-3 sm:flex-row flex-col w-full">
                  <p>Aqui</p>
                </div> */}
                <Button variant={"outline"}>
                  Adicionar livro a essa Estante
                </Button>
              </CardContent>
              <CardFooter className="flex-col gap-2"></CardFooter>
            </Card>
          )}
          emptyMessage="Nenhuma estante encontrada."
        />
      </div>
    </>
  );
}

export default ClientBookshelves;
