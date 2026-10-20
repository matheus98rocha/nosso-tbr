import { BookMapper } from "@/services/books/books.mapper";
import type { BookDomain } from "@/types/books.types";

import type { ReadingNowScope } from "../readingNow.types";

export function matchesReadingNowScope(
  book: Pick<BookDomain, "readerIds" | "chosen_by">,
  scope: ReadingNowScope,
): boolean {
  if (scope === "collective") {
    return BookMapper.isCollectiveReadingBook(book);
  }

  return BookMapper.isSoloBook(book);
}
