import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api/clientJsonFetch";
import { BookshelfCreateValidator } from "../validators/bookshelves.validator";
import { ErrorHandler } from "@/services/errors/error";

export class BookshelfService {
  private supabase = createClient();

  async create(shelf: { name: string; user_id: string }): Promise<void> {
    await apiJson<{ ok: true }>("/api/shelves", {
      method: "POST",
      body: JSON.stringify(shelf),
    });
  }
  async update(id: string, shelf: BookshelfCreateValidator): Promise<void> {
    await apiJson<{ ok: true }>(`/api/shelves/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ name: shelf.name }),
    });
  }
  async delete(id: string): Promise<void> {
    await apiJson<{ ok: true }>(`/api/shelves/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async getShelfById(
    id: string,
  ): Promise<{ id: string; name: string } | null> {
    const { data, error } = await this.supabase
      .from("custom_shelves")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }
  async addBookToShelf(bookshelfId: string, bookId: string): Promise<void> {
    try {
      await apiJson<{ ok: true }>(
        `/api/shelves/${encodeURIComponent(bookshelfId)}/books/${encodeURIComponent(bookId)}`,
        { method: "POST" },
      );
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
