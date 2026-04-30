import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/constants/keys";
import { SHELF_BOOK_CANNOT_ADD_MESSAGE } from "@/constants/shelfBook";
import { getBookshelfBooksPath } from "@/lib/routes/shelves";
import {
  BookshelfService,
  fetchBookShelves,
} from "@/modules/shelves/services/booksshelves.service";
import { BookshelfDomain } from "@/modules/shelves/types/bookshelves.types";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { AddBookToShelfProps } from "../types/addBookToShelf.types";

export function useAddBookToShelf({
  bookId,
  handleClose,
  isOpen,
}: AddBookToShelfProps) {
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();

  const { data: bookshelves = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.shelves.all,
    queryFn: () => {
      return fetchBookShelves();
    },
    enabled: isLoggedIn && isOpen,
    staleTime: 1000 * 60 * 5,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const service = new BookshelfService();
      await service.addBookToShelf(selectedShelfId, bookId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shelves.all });
      setSelectedShelfId("");
      handleClose(false);
      router.push(getBookshelfBooksPath(selectedShelfId));
    },
    onError: () => {
      toast(SHELF_BOOK_CANNOT_ADD_MESSAGE, { className: "toast-error" });
    },
  });

  const handleSubmit = useCallback(() => {
    if (selectedShelfId) mutate();
  }, [selectedShelfId, mutate]);

  const bookshelfOptions = useMemo(() => {
    const list = (bookshelves ?? []) as BookshelfDomain[];
    return list
      .filter(
        (shelf) =>
          !shelf.books?.some((entry) => entry.id === bookId),
      )
      .map((shelf) => ({
        label: shelf.name,
        value: shelf.id,
      }));
  }, [bookshelves, bookId]);

  return {
    selectedShelfId,
    setSelectedShelfId,
    isLoading,
    isPending,
    bookshelfOptions,
    handleSubmit,
  };
}
