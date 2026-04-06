import { BookDomain } from "@/types/books.types";

export type BookCardProps =
  | {
      book: BookDomain;
      isShelf?: false;
      shelfId?: undefined;
    }
  | {
      book: BookDomain;
      isShelf: true;
      shelfId: string;
    };

export type StatusDisplay = {
  label: string;
  colorClass: string;
  dotClass: string;
} | null;
