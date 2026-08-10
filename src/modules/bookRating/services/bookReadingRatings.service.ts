import { createClient } from "@/lib/supabase/client";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";

function chunkIds<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export class BookReadingRatingsService {
  private supabase = createClient();

  async listStarsByBookIds(bookIds: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (!bookIds.length) {
      return result;
    }
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();

      if (authError || !user) {
        return result;
      }

      for (const chunk of chunkIds(bookIds, 80)) {
        const { data, error } = await this.supabase
          .from("book_reading_ratings")
          .select("book_id, stars")
          .eq("user_id", user.id)
          .in("book_id", chunk);

        if (error) {
          throw new RepositoryError(
            "Falha ao carregar avaliações",
            undefined,
            undefined,
            error,
          );
        }
        for (const row of data ?? []) {
          const bid = row.book_id as string;
          const stars = Number(row.stars);
          if (bid && stars >= 1 && stars <= 5) {
            result.set(bid, stars);
          }
        }
      }
      return result;
    } catch (error) {
      const normalized = ErrorHandler.normalize(error, {
        service: "BookReadingRatingsService",
        method: "listStarsByBookIds",
      });
      ErrorHandler.log(normalized);
      throw normalized;
    }
  }

  async upsertRating(bookId: string, stars: number): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new RepositoryError("Unauthorized", undefined, undefined, authError);
    }

    const { error } = await this.supabase.from("book_reading_ratings").upsert(
      {
        user_id: user.id,
        book_id: bookId,
        stars,
      },
      {
        onConflict: "user_id,book_id",
      },
    );

    if (error) {
      throw new RepositoryError(
        "Falha ao salvar avaliação",
        undefined,
        undefined,
        error,
        { bookId, stars },
      );
    }
  }

  async removeRating(bookId: string): Promise<void> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new RepositoryError("Unauthorized", undefined, undefined, authError);
    }

    const { error } = await this.supabase
      .from("book_reading_ratings")
      .delete()
      .eq("user_id", user.id)
      .eq("book_id", bookId);

    if (error) {
      throw new RepositoryError(
        "Falha ao remover avaliação",
        undefined,
        undefined,
        error,
        { bookId },
      );
    }
  }
}
