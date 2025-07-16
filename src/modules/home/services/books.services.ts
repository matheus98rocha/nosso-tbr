import { createClient } from "@/lib/supabase/client";
import { BookMapper } from "@/modules/home/services/mappers/books.mappers";
import { BookCreateValidator, BookDomain } from "@/types/books.types";
import { FiltersOptions } from "../components/filtersSheet/filters";
import { BookQueryBuilder } from "./builders/bookQuery.builder";

export class BookService {
  private supabase = createClient();

  async getAll(filters?: FiltersOptions): Promise<BookDomain[]> {
    const status: "not_started" | "reading" | "finished" | undefined =
      filters?.status === "not_started" ||
      filters?.status === "reading" ||
      filters?.status === "finished"
        ? filters.status
        : undefined;

    const query = new BookQueryBuilder(this.supabase)
      .withReaders(filters?.readers)
      .withStatus(status)
      .withGender(filters?.gender)
      .sortByCreatedAt()
      .build();

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
