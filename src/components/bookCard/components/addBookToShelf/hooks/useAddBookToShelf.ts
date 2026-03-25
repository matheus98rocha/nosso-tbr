import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AddBookToShelfProps } from "../types/addBookToShelf.types";
import {
  BookshelfService,
  fetchBookShelves,
} from "@/modules/shelves/services/booksshelves.service";
import { SelectedBookshelf } from "@/modules/shelves/types/bookshelves.types";
import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { getBookshelfBooksPath } from "@/lib/routes/shelves";

export function useAddBookToShelf({ bookId, handleClose }: AddBookToShelfProps) {
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();

  const { data: bookshelves = [], isLoading } = useQuery({
    queryKey: ["bookshelves"],
    queryFn: fetchBookShelves,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const service = new BookshelfService();
      await service.addBookToShelf(selectedShelfId, bookId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookshelves"] });
      setSelectedShelfId("");
      handleClose(false);
      router.push(getBookshelfBooksPath(selectedShelfId));
    },
  });

  const handleSubmit = () => {
    if (selectedShelfId) mutate();
  };

  const bookshelfOptions =
    bookshelves?.map((shelf: SelectedBookshelf) => ({
      label: shelf.name,
      value: shelf.id,
    })) ?? [];

  return {
    selectedShelfId,
    setSelectedShelfId,
    isLoading,
    isPending,
    bookshelfOptions,
    handleSubmit,
  };
}
