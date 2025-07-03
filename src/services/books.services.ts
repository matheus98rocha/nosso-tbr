import { createClient } from "@/lib/supabase/client";
import { BookMapper } from "@/mappers/books.mappers";
import { BookDomain } from "@/types/books.types";

export class BookService {
  private supabase = createClient();

  async getAll(): Promise<BookDomain[]> {
    const { data, error } = await this.supabase.from("books").select("*");
    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map(BookMapper.toDomain);
  }
}
