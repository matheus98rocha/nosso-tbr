"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookDialog } from "@/components/customComponents/bookDialog/bookDialog";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import { BookCard } from "@/components/customComponents/bookCard/bookCard";
// import { BookCreateValidator } from "@/types/books.types";
// import { useState } from "react";

export default function Home() {
  const { allBooks, isLoadingAllBooks, progress, isFetched } = useHome();

  const dialogModal = useModal();
  // const dropdownModal = useModal();

  // const [bookDialogData, setBookDialogData] = useState<
  //   BookCreateValidator | undefined
  // >(undefined);

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
            {isFetched &&
              (allBooks?.length === 0 ? (
                <div className="text-gray-500">Nenhum livro encontrado.</div>
              ) : (
                <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allBooks?.map((book) => (
                    <BookCard book={book} key={book.id} />
                  ))}
                </div>
              ))}
          </div>
        )}
      </main>
    </>
  );
}
