import { createClient } from "@/lib/supabase/client";
import { BookMapper } from "@/mappers/books.mappers";
import { BookCreateValidator, BookDomain } from "@/types/books.types";

export class BookService {
  private supabase = createClient();

  async getAll(filters?: { readers?: string[] }): Promise<BookDomain[]> {
    let query = this.supabase.from("books").select("*");

    if (filters?.readers && filters.readers.length > 0) {
      query = query.contains("readers", filters.readers);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map(BookMapper.toDomain);
  }
  async create(book: BookCreateValidator): Promise<void> {
    const payload = BookMapper.toPersistence(book);

    const { error } = await this.supabase.from("books").insert(payload);
    if (error) throw new Error(error.message);
  }
  async edit(id: string, book: BookCreateValidator): Promise<void> {
    const payload = BookMapper.toPersistence(book);

    const { error } = await this.supabase
      .from("books")
      .update(payload)
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("books").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
