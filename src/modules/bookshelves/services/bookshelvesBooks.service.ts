import { createClient } from "@/lib/supabase/client";
import { BookMapper } from "@/modules/home/services/mappers/books.mappers";

import { BookDomain, BookPersistence } from "@/types/books.types";

export class BookshelfServiceBooks {
  private supabase = createClient();
  async getBooksFromShelf(bookshelfId: string): Promise<BookDomain[]> {
    const { data, error } = await this.supabase
      .from("custom_shelf_books")
      .select("book:books(*)")
      .eq("shelf_id", bookshelfId);

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data
      .filter((row) => row.book && !Array.isArray(row.book))
      .map((row) =>
        BookMapper.toDomain(row.book as unknown as BookPersistence)
      );
  }
}
