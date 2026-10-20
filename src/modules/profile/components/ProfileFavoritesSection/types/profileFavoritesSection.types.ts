import type { BookDomain } from "@/types/books.types";

export type ProfileFavoritesSectionProps = {
  books: BookDomain[];
  isLoading: boolean;
  isFetched: boolean;
  isError: boolean;
  allBooksHref: string;
  hideInteractions?: boolean;
};
