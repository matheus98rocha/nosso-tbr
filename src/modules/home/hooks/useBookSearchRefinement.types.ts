import { BookDomain } from "@/types/books.types";

export type UseBookSearchRefinementParams = {
  books: BookDomain[];
  searchTerm: string;
  isEnabled: boolean;
};

export type UseBookSearchRefinementResult = {
  refinedBooks: BookDomain[];
};
