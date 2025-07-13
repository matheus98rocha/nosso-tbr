import { createClient } from "@/lib/supabase/client";
import { BookshelfCreateValidator } from "../validators/bookshelves.validator";
import { BookshelfDomain } from "../types/bookshelves.types";
import { BookshelfMapper } from "../mapper/bookshelves.mapper";

export class BookshelfService {
  private supabase = createClient();

  async create(shelf: BookshelfCreateValidator): Promise<void> {
    const { error } = await this.supabase
      .from("custom_shelves")
      .insert({ name: shelf.name });

    if (error) throw new Error(error.message);
  }

  async getAll(): Promise<BookshelfDomain[]> {
    const { data, error } = await this.supabase
      .from("custom_shelves")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map(BookshelfMapper.toDomain);
  }
}
