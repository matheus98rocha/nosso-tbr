"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { BookDomain } from "@/modules/home/types/books.types";
import { BookshelfServiceBooks } from "./bookshelvesBooks.service";
import { ListGrid } from "@/components/listGrid/listGrid";
import { BookCard } from "../home/components/bookCard/bookCard";

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
      <h1 className="text-xl font-bold">Books in Shelf</h1>

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
