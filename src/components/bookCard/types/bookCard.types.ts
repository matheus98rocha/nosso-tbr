import { BookDomain } from "@/types/books.types";

export type BookCardProps = {
  book: BookDomain;
  isShelf?: boolean;
  /** Estante atual ao remover livro da estante (RN45 + API guard). */
  shelfId?: string;
};

export type StatusDisplay = {
  label: string;
  colorClass: string;
  dotClass: string;
} | null;
