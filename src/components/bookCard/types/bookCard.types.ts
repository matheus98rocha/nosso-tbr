import { BookDomain } from "@/types/books.types";

export type BookCardProps =
  | {
      book: BookDomain;
      isShelf?: false;
      shelfId?: undefined;
      hideInteractions?: boolean;
      onEditBook?: () => void;
    }
  | {
      book: BookDomain;
      isShelf: true;
      shelfId: string;
      hideInteractions?: boolean;
      onEditBook?: () => void;
    };

export type StatusDisplay = {
  label: string;
  colorClass: string;
  dotClass: string;
} | null;
