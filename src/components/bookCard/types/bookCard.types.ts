import { BookDomain } from "@/types/books.types";

export type BookCardProps =
  | {
      book: BookDomain;
      isShelf?: false;
      shelfId?: undefined;
      hideInteractions?: boolean;
    }
  | {
      book: BookDomain;
      isShelf: true;
      shelfId: string;
      hideInteractions?: boolean;
    };

export type StatusDisplay = {
  label: string;
  colorClass: string;
  dotClass: string;
} | null;
