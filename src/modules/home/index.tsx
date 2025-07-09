"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookDialog } from "@/modules/home/components/bookDialog/bookDialog";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import { BookList } from "./components/BookList";
// import { BookCreateValidator } from "@/types/books.types";
// import { useState } from "react";

export default function ClientHome() {
  const { allBooks, isLoadingAllBooks, progress, isFetched } = useHome();

  const dialogModal = useModal();

  return (
    <>
      <BookDialog
        isOpen={dialogModal.isOpen}
        onOpenChange={dialogModal.setIsOpen}
      />
      <main className="p-6 flex flex-col items-center justify-start w-full h-full gap-6">
        <header className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-bold mb-4">Nosso TBR</h1>
          <Button onClick={() => dialogModal.setIsOpen(true)}>
            Adicionar Livro
          </Button>
        </header>
        {isLoadingAllBooks ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <Progress value={progress} className="w-[60%] mb-4" />
          </div>
        ) : (
          <div className="w-full">
            {isFetched && allBooks?.length === 0 ? (
              <div className="text-gray-500">Nenhum livro encontrado.</div>
            ) : (
              <BookList books={allBooks ?? []} />
            )}
          </div>
        )}
      </main>
    </>
  );
}
