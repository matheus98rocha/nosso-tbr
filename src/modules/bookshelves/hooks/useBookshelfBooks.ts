import { useQuery } from "@tanstack/react-query";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { bookshelfBooksQueryKey } from "@/modules/bookshelves/bookshelfBooksQueryKey";
import { BookshelfServiceBooks } from "../services/bookshelvesBooks.service";

export function useBookshelfBooks(bookshelfId: string | undefined) {
  const isLoggedIn = useIsLoggedIn();
  return useQuery({
    queryKey: bookshelfBooksQueryKey(bookshelfId),
    queryFn: () =>
      new BookshelfServiceBooks().getBooksFromShelf(bookshelfId!),
    enabled: Boolean(bookshelfId) && isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });
}
