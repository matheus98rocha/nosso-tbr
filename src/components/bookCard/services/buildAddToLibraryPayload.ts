import { BOOK_COVER_PLACEHOLDER_SRC, isAllowedBookCoverUrl } from "@/constants/bookCover";
import type { BookCreateValidator, BookDomain } from "@/types/books.types";

export function buildAddToLibraryPayload(
  book: BookDomain,
  userId: string,
): BookCreateValidator {
  const imageUrl = book.image_url?.trim() ?? "";
  const canReuseCover =
    imageUrl.length > 0 &&
    imageUrl !== BOOK_COVER_PLACEHOLDER_SRC &&
    isAllowedBookCoverUrl(imageUrl) &&
    !imageUrl.startsWith("/");

  return {
    title: book.title,
    pages: book.pages,
    readers: [userId],
    chosen_by: userId,
    user_id: userId,
    author_id: book.authorId ?? "",
    start_date: null,
    end_date: null,
    planned_start_date: null,
    gender: book.gender ?? "",
    image_url: canReuseCover ? imageUrl : "",
    status: "not_started",
    is_reread: false,
  };
}
