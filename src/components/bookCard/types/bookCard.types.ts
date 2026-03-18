import { BookDomain } from "@/types/books.types";

export type BookCardProps = {
  book: BookDomain;
  isShelf?: boolean;
};

export type StatusDisplay = {
  label: string;
  colorClass: string;
  dotClass: string;
} | null;
