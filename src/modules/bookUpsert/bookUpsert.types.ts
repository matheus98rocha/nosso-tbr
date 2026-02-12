import { BookDomain } from "@/types/books.types";

export type CreateBookProps = {
  bookData?: BookDomain;
  isBookFormOpen: boolean;
  setIsBookFormOpen: (open: boolean) => void;
};

export type UseCreateBookDialog = {
  bookData: BookDomain | undefined;
  setIsBookFormOpen: (open: boolean) => void;
  chosenByOptions: {
    label: string;
    value: string;
  }[];
};
