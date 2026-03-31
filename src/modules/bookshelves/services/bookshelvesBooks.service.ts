import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api/clientJsonFetch";
import { BookMapper } from "@/services/books/books.mapper";

import { BookDomain, BookPersistence } from "@/types/books.types";

export class BookshelfServiceBooks {
  private supabase = createClient();
  async getBooksFromShelf(bookshelfId: string): Promise<BookDomain[]> {
    const { data, error } = await this.supabase
      .from("custom_shelf_books")
      .select(
        `
        book:books(
          *,
          author:authors!books_author_id_fkey(name)
        )
      `,
      )
      .eq("shelf_id", bookshelfId);

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data
      .filter((row) => row.book && !Array.isArray(row.book))
      .map((row) =>
        BookMapper.toDomain(row.book as unknown as BookPersistence),
      );
  }

  async removeBookFromShelf(shelfId: string, bookId: string): Promise<void> {
    await apiJson<{ ok: true }>(
      `/api/shelves/${encodeURIComponent(shelfId)}/books/${encodeURIComponent(bookId)}`,
      { method: "DELETE" },
    );
  }
}
