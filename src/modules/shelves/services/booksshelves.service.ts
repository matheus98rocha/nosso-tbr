import { createClient } from "@/lib/supabase/client";
import { BookshelfCreateValidator } from "../validators/bookshelves.validator";
import { BookshelfDomain } from "../types/bookshelves.types";
import { BookshelfMapper } from "./mapper/bookshelves.mapper";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";

export class BookshelfService {
  private supabase = createClient();

  async create(shelf: BookshelfCreateValidator): Promise<void> {
    const { error } = await this.supabase
      .from("custom_shelves")
      .insert({ name: shelf.name, owner: shelf.owner });

    if (error) throw new Error(error.message);
  }
  async update(id: string, shelf: BookshelfCreateValidator): Promise<void> {
    const { error } = await this.supabase
      .from("custom_shelves")
      .update({ name: shelf.name, owner: shelf.owner })
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("custom_shelves")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
  async getAll(): Promise<BookshelfDomain[]> {
    const { data, error } = await this.supabase
      .from("custom_shelves")
      .select(
        `*,custom_shelf_books (
          book:books 
          (
            id,
            image_url
          )
        )`
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map(BookshelfMapper.toDomain);
  }

  async addBookToShelf(bookshelfId: string, bookId: string): Promise<void> {
    try {
      const { error } = await this.supabase.from("custom_shelf_books").insert({
        shelf_id: bookshelfId,
        book_id: bookId,
      });

      if (error) {
        throw new RepositoryError(
          "Falha ao adicionar livro á estante",
          undefined,
          undefined,
          error,
          {
            origin: "BookshelfService",
          }
        );
      }
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "booksshelves",
        method: "create",
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
