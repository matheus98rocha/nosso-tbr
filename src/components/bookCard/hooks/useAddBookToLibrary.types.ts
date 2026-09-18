import type { BookDomain } from "@/types/books.types";

export type UseAddBookToLibraryParams = {
  book: BookDomain;
  enabled: boolean;
};
