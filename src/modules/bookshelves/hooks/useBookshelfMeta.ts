import { useQuery } from "@tanstack/react-query";
import { BookshelfService } from "@/modules/shelves/services/booksshelves.service";

export function useBookshelfMeta(bookshelfId: string | undefined) {
  return useQuery({
    queryKey: ["bookshelf-meta", bookshelfId],
    queryFn: () => new BookshelfService().getShelfById(bookshelfId!),
    enabled: Boolean(bookshelfId),
    staleTime: 1000 * 60 * 5,
  });
}
