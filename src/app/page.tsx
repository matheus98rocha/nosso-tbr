"use client";

import { Button } from "@/components/ui/button";
import { useHome } from "./home/useHome";
import { Progress } from "@/components/ui/progress";
import { DialogTrigger } from "@/components/ui/dialog";
import { BookDialog } from "@/components/bookDialog/bookDialog";
import { EllipsisVerticalIcon } from "lucide-react";
import { DropdownBook } from "@/components/dropdownBook/dropdownBook";

export default function Home() {
  const { allBooks, isLoadingAllBooks, progress, isFetched } = useHome();
  console.log(allBooks);
  return (
    <main className="p-6 flex flex-col items-center justify-start w-full h-full gap-6">
      <header className="flex justify-between items-center w-full">
        <h1 className="text-2xl font-bold mb-4">Nosso TBR</h1>
        <BookDialog
          trigger={
            <DialogTrigger asChild>
              <Button>Adicionar Livro</Button>
            </DialogTrigger>
          }
        />
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
              <ul className="space-y-2">
                {allBooks?.map((book) => (
                  <li
                    key={book.id}
                    className="border p-3 rounded shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <span>
                        <strong>{book.title}</strong> — {book.author} (
                        {book.pages} páginas)
                      </span>

                      <div className="text-sm text-gray-600">
                        Escolhido por: {book.chosen_by} | Status:
                        {book.status === "reading"
                          ? "Já iniciei a leitura"
                          : book.status === "finished"
                          ? "Terminei"
                          : "Vou iniciar a leitura"}
                      </div>
                    </div>
                    <BookDialog
                      trigger={
                        <DropdownBook trigger={<EllipsisVerticalIcon />} />
                      }
                      bookData={book}
                    />
                  </li>
                ))}
              </ul>
            ))}
        </div>
      )}
    </main>
  );
}
