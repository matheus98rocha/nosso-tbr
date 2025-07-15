"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { BookDomain } from "@/types/books.types";
import { ListGrid } from "@/components/listGrid/listGrid";
import { BookCard } from "../home/components/bookCard/bookCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookshelfServiceBooks } from "./services/bookshelvesBooks.service";

function BookshelvesBooks() {
  const { id } = useParams();
  const bookshelfId = id as string;

  const { mutate, data, isPending, isError, isSuccess } = useMutation<
    BookDomain[]
  >({
    mutationFn: () =>
      new BookshelfServiceBooks().getBooksFromShelf(bookshelfId),
  });

  useEffect(() => {
    if (bookshelfId) mutate();
  }, [bookshelfId, mutate]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between mb-4">
        {/* Go back */}
        <Link
          href="/bookshelves"
          className="flex items-center justify-start gap-2"
        >
          <ArrowLeft /> Voltar
        </Link>
      </div>
      <h1 className="text-xl font-bold">Livros na estante</h1>

      {isPending && <p>Loading...</p>}
      {isError && <p>Error loading books.</p>}

      {data?.length === 0 && <p>No books found.</p>}

      <ListGrid<BookDomain>
        items={data ?? []}
        isLoading={isPending}
        isFetched={isSuccess}
        renderItem={(book) => <BookCard key={book.id} book={book} />}
      />
    </div>
  );
}

export default BookshelvesBooks;
