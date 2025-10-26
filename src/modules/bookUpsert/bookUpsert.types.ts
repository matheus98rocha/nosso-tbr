import { BookCreateValidator } from "@/types/books.types";

export type CreateBookProps = {
  bookData?: BookCreateValidator;
  isBookFormOpen: boolean;
  setIsBookFormOpen: (open: boolean) => void;
};

export type UseCreateBookDialog = {
  bookData: BookCreateValidator | undefined;
  setIsBookFormOpen: (open: boolean) => void;
  chosenByOptions: {
    label: string;
    value: string;
  }[];
};
