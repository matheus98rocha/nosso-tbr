import { useQuery } from "@tanstack/react-query";
import { BookshelfServiceBooks } from "../services/bookshelvesBooks.service";

export function useBookshelfBooks(bookshelfId: string | undefined) {
  return useQuery({
    queryKey: ["bookshelf-books", bookshelfId],
    queryFn: () =>
      new BookshelfServiceBooks().getBooksFromShelf(bookshelfId!),
    enabled: Boolean(bookshelfId),
  });
}
