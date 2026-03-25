"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BookDomain } from "@/types/books.types";
import { ListGrid } from "@/components/listGrid/listGrid";
import { BookCard } from "@/components/bookCard/bookCard";
import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { useBookshelfBooks } from "./_hooks/useBookshelfBooks";
import { useBookshelfMeta } from "./_hooks/useBookshelfMeta";
import { SHELVES_LIST_PATH } from "@/lib/routes/shelves";
import { Skeleton } from "@/components/ui/skeleton";

function ClientBookshelves() {
  const { id } = useParams();
  const bookshelfId = typeof id === "string" ? id : undefined;

  const { data: books = [], isLoading, isError, isSuccess, isFetched } =
    useBookshelfBooks(bookshelfId);

  const {
    data: shelfMeta,
    isLoading: isLoadingShelfMeta,
    isError: isShelfMetaError,
  } = useBookshelfMeta(bookshelfId);

  if (!bookshelfId) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center"
        role="status"
        aria-live="polite"
      >
        <Library
          className="h-12 w-12 text-muted-foreground"
          aria-hidden
        />
        <p className="text-base text-muted-foreground">
          Não foi possível abrir esta estante. Volte e escolha outra estante.
        </p>
        <Link
          href={SHELVES_LIST_PATH}
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-4 text-base font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Voltar para a lista de estantes"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={SHELVES_LIST_PATH}
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-md px-3 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Voltar para a lista de estantes"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
          Voltar
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Livros na estante
        </h1>
        {isLoadingShelfMeta ? (
          <Skeleton
            className="h-8 w-full max-w-xs sm:max-w-md"
            aria-hidden
          />
        ) : shelfMeta?.name ? (
          <p
            id="bookshelf-detail-name"
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            {shelfMeta.name}
          </p>
        ) : isShelfMetaError ? null : (
          <p className="text-base font-medium text-muted-foreground">Estante</p>
        )}
        <p className="text-base text-muted-foreground">
          Os livros que você adicionou a esta estante aparecem abaixo.
        </p>
      </header>

      <ListGrid<BookDomain>
        items={books}
        isLoading={isLoading}
        isFetched={isFetched && isSuccess}
        isError={isError}
        emptyMessage="Nenhum livro nesta estante. Adicione livros pela sua biblioteca ou pelas estantes."
        renderItem={(book) => (
          <BookCard key={book.id} book={book} isShelf={true} />
        )}
      />
    </div>
  );
}

export default ClientBookshelves;
