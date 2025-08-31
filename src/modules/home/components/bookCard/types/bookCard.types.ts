import { BookDomain } from "@/types/books.types";

export type BookCardProps = {
  book: BookDomain;
  isShelf?: boolean;
};
