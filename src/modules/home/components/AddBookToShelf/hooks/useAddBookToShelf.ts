import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AddBookToShelfProps } from "../types/addBookToShelf.types";
import { BookshelfService } from "@/modules/shelves/services/booksshelves.service";
import { SelectedBookshelf } from "@/modules/shelves/types/bookshelves.types";
import { useRouter } from "next/navigation";

export function useAddBookToShelf({
  bookId,
  handleClose,
}: AddBookToShelfProps) {
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: bookshelves = [], isLoading } = useQuery({
    queryKey: ["bookshelves"],
    queryFn: async () => {
      const service = new BookshelfService();
      return service.getAll();
    },
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
      router.push(`/bookshelves/${selectedShelfId}`);
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
