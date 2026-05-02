import { createClient } from "@/lib/supabase/client";
import { BookMapper } from "@/services/books/books.mapper";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import type { BookDomain, BookPersistence } from "@/types/books.types";

const BOOK_WITH_AUTHOR = `
  *,
  author:authors!books_author_id_fkey (
    name
  )
`;

function chunkIds<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export class BookFavoritesService {
  private supabase = createClient();

  async listBookIdsForCurrentUser(): Promise<string[]> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();

      if (authError || !user) {
        return [];
      }

      const { data, error } = await this.supabase
        .from("user_book_favorites")
        .select("book_id")
        .eq("user_id", user.id);

      if (error) {
        throw new RepositoryError(
          "Falha ao carregar favoritos",
          undefined,
          undefined,
          error,
        );
      }

      return (data ?? []).map((row) => row.book_id as string);
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "BookFavoritesService",
        method: "listBookIdsForCurrentUser",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }

  async getFavoriteBooksForUser(profileUserId: string): Promise<BookDomain[]> {
    try {
      const { data: favRows, error: favError } = await this.supabase
        .from("user_book_favorites")
        .select("book_id, created_at")
        .eq("user_id", profileUserId)
        .order("created_at", { ascending: false });

      if (favError) {
        throw new RepositoryError(
          "Falha ao carregar favoritos do perfil",
          undefined,
          undefined,
          favError,
          { profileUserId },
        );
      }

      const orderedIds = (favRows ?? []).map((r) => r.book_id as string);
      if (orderedIds.length === 0) {
        return [];
      }

      const byId = new Map<string, BookPersistence>();
      for (const part of chunkIds(orderedIds, 80)) {
        const { data: books, error: booksError } = await this.supabase
          .from("books")
          .select(BOOK_WITH_AUTHOR)
          .in("id", part);

        if (booksError) {
          throw new RepositoryError(
            "Falha ao carregar livros favoritos",
            undefined,
            undefined,
            booksError,
          );
        }
        for (const row of books ?? []) {
          byId.set(row.id as string, row as unknown as BookPersistence);
        }
      }

      return orderedIds
        .map((id) => byId.get(id))
        .filter((p): p is BookPersistence => p != null)
        .map(BookMapper.toDomain);
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "BookFavoritesService",
        method: "getFavoriteBooksForUser",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }

  async add(bookId: string): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new RepositoryError("Unauthorized", undefined, undefined, authError);
    }

    const { error } = await this.supabase.from("user_book_favorites").insert({
      user_id: user.id,
      book_id: bookId,
    });

    if (error) {
      throw new RepositoryError(
        "Falha ao favoritar livro",
        undefined,
        undefined,
        error,
        { bookId },
      );
    }
  }

  async remove(bookId: string): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new RepositoryError("Unauthorized", undefined, undefined, authError);
    }

    const { error } = await this.supabase
      .from("user_book_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("book_id", bookId);

    if (error) {
      throw new RepositoryError(
        "Falha ao remover favorito",
        undefined,
        undefined,
        error,
        { bookId },
      );
    }
  }
}
