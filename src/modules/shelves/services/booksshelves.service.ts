import { createClient } from "@/lib/supabase/client";
import { BookshelfCreateValidator } from "../validators/bookshelves.validator";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";

export class BookshelfService {
  private supabase = createClient();

  async create(shelf: { name: string; user_id: string }): Promise<void> {
    const { error } = await this.supabase
      .from("custom_shelves")
      .insert({ name: shelf.name });

    if (error) throw new Error(error.message);
  }
  async update(id: string, shelf: BookshelfCreateValidator): Promise<void> {
    const { error } = await this.supabase
      .from("custom_shelves")
      .update({ name: shelf.name })
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

export async function fetchBookShelves() {
  const res = await fetch("/api/shelves", {
    next: { tags: ["shelves"] },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch shelves");
  }

  return res.json();
}
