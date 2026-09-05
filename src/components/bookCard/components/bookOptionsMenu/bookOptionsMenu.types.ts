import type { BookDomain } from "@/types/books.types";

export type BookOptionsMenuProps = {
  book: BookDomain & { id: string };
  onEditBook?: () => void;
  className?: string;
  triggerClassName?: string;
  iconClassName?: string;
};
