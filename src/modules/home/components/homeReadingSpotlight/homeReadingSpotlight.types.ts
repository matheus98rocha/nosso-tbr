import type { BookDomain } from "@/types/books.types";

export type HomeReadingSpotlightProps = {
  className?: string;
  onEditBook?: (book: BookDomain) => void;
};
