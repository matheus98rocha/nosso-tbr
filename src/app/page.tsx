"use client";

import { Button } from "@/components/ui/button";
import { useHome } from "./home/useHome";
import { Progress } from "@/components/ui/progress";
import { CreateBookDialog } from "@/components/createBookDialog/createBookDialog";
import { DialogTrigger } from "@/components/ui/dialog";

export default function Home() {
  const { allBooks, isLoadingAllBooks, progress, isFetched } = useHome();

  return (
    <main className="p-6 flex flex-col items-center justify-start w-full h-full gap-6">
      <header className="flex justify-between items-center w-full">
        <h1 className="text-2xl font-bold mb-4">Nosso TBR</h1>
        <CreateBookDialog
          trigger={
            <DialogTrigger asChild>
              <Button>Adicionar Livro</Button>
            </DialogTrigger>
          }
        />
      </header>
      <div className="w-full">
        {isLoadingAllBooks && (
          <Progress value={progress} className="w-[60%] mb-4" />
        )}
        {isFetched &&
          (allBooks?.length === 0 ? (
            <div className="text-gray-500">Nenhum livro encontrado.</div>
          ) : (
            <ul className="space-y-2">
              {allBooks?.map((book) => (
                <li key={book.id} className="border p-3 rounded shadow-sm">
                  <div>
                    <span>
                      <strong>{book.title}</strong> — {book.author} (
                      {book.pages} páginas)
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Escolhido por: {book.chosen_by} | Status:{" "}
                    {book.status === "reading"
                      ? "Lendo"
                      : book.status === "finished"
                      ? "Finalizado"
                      : "Pendente"}
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </main>
  );
}
