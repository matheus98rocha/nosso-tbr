import { createClient } from "@/lib/supabase/client";
import { BookCreateValidator } from "@/types/books.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { BookQueryBuilder } from "@/services/books/bookQuery.builder";
import { ensureCreatableStatus } from "./bookUpsert.validation";
import { apiJson } from "@/lib/api/clientJsonFetch";
import type { Status } from "@/types/books.types";
import { BookCatalogMatchService } from "./bookCatalogMatch.service";
import {
  BookCatalogCandidate,
  BookCatalogMatchResult,
} from "../types/bookDiscovery.types";
import {
  isSuggestJoinReadingAllowed,
  pickCounterpartReaderId,
} from "./bookCatalogDiscovery.rules";


type AuthorJoinRow = {
  name: string | null;
};

type CatalogBookRow = {
  id: string;
  title: string;
  author_id: string;
  chosen_by: string | null;
  status: string | null;
  readers: unknown;
  image_url: string | null;
  pages: number | null;
  author: AuthorJoinRow | AuthorJoinRow[] | null;
};

function extractAuthorName(author: CatalogBookRow["author"]): string {
  if (Array.isArray(author)) {
    return author[0]?.name ?? "Autor desconhecido";
  }

  return author?.name ?? "Autor desconhecido";
}

async function areUsersMutuallyFollowing(
  supabase: ReturnType<typeof createClient>,
  a: string,
  b: string,
): Promise<boolean> {
  const [{ data: forward }, { data: backward }] = await Promise.all([
    supabase
      .from("user_followers")
      .select("follower_id")
      .eq("follower_id", a)
      .eq("following_id", b)
      .maybeSingle(),
    supabase
      .from("user_followers")
      .select("follower_id")
      .eq("follower_id", b)
      .eq("following_id", a)
      .maybeSingle(),
  ]);

  return !!forward && !!backward;
}

export class BookUpsertService {
  private supabase = createClient();
  private catalogMatchService = new BookCatalogMatchService();

  async create(book: BookCreateValidator): Promise<{ id: string }> {
    try {
      ensureCreatableStatus(book.status);

      const result = await apiJson<{ id: string }>("/api/books", {
        method: "POST",
        body: JSON.stringify(book),
      });

      if (!result?.id) {
        throw new RepositoryError(
          "Livro criado, mas ID não retornado.",
          undefined,
          undefined,
          undefined,
          { book },
        );
      }

      return result;
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "create",
        book,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async edit(id: string, book: BookCreateValidator): Promise<void> {
    try {
      await apiJson<{ ok: true }>(
        `/api/books/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(book),
        },
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "edit",
        id,
        book,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async checkDuplicateBook(title: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const duplicateCheckQuery = await new BookQueryBuilder(supabase)
        .withSearchTerm(title)
        .build();

      const { data: booksWithSameTitle } = await duplicateCheckQuery;

      return booksWithSameTitle?.length > 0;
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "checkDuplicateBook",
        title,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async findCatalogBookMatch(params: {
    title: string;
    authorId: string;
    currentUserId?: string;
  }): Promise<BookCatalogMatchResult | null> {
    try {
      if (!params.authorId) {
        return null;
      }

      const { data } = await this.supabase
        .from("books")
        .select(
          `id,title,author_id,chosen_by,status,readers,image_url,pages,author:authors!books_author_id_fkey(name)`,
        )
        .eq("author_id", params.authorId)
        .limit(30)
        .throwOnError();

      const catalogRows = (data ?? []) as CatalogBookRow[];

      const catalogCandidates: BookCatalogCandidate[] = catalogRows.map((row) => ({
        id: row.id,
        title: row.title,
        authorId: row.author_id,
        authorName: extractAuthorName(row.author),
        imageUrl: row.image_url,
        pages: row.pages ?? null,
        readers: Array.isArray(row.readers) ? row.readers : [],
        chosenBy: row.chosen_by ?? null,
        chosenByDisplayName: null,
        status: (row.status as Status | null) ?? null,
      }));

      const match = this.catalogMatchService.findBestMatch({
        title: params.title,
        authorId: params.authorId,
        currentUserId: params.currentUserId,
        candidates: catalogCandidates,
      });

      if (!match) {
        return null;
      }

      let candidate = match.candidate;
      if (candidate.chosenBy) {
        const { data: chosenUser } = await this.supabase
          .from("users")
          .select("display_name")
          .eq("id", candidate.chosenBy)
          .maybeSingle();
        candidate = {
          ...candidate,
          chosenByDisplayName: chosenUser?.display_name ?? null,
        };
      }

      const matchWithCandidate: BookCatalogMatchResult = {
        ...match,
        candidate,
      };

      if (matchWithCandidate.userAlreadyLinked) {
        return { ...matchWithCandidate, suggestJoinEligible: false };
      }

      const uid = params.currentUserId;
      if (!uid) {
        return { ...matchWithCandidate, suggestJoinEligible: false };
      }

      const counterpart = pickCounterpartReaderId(
        matchWithCandidate.candidate.chosenBy,
        matchWithCandidate.candidate.readers ?? [],
        uid,
      );

      const mutualFollow = counterpart
        ? await areUsersMutuallyFollowing(this.supabase, uid, counterpart)
        : false;

      const suggestJoinEligible = isSuggestJoinReadingAllowed(
        false,
        matchWithCandidate.candidate.status,
        mutualFollow,
      );

      return { ...matchWithCandidate, suggestJoinEligible };
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "findCatalogBookMatch",
        ...params,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async linkReaderToExistingBook(bookId: string): Promise<void> {
    try {
      await apiJson<{ ok: true }>(
        `/api/books/${encodeURIComponent(bookId)}/link`,
        { method: "POST" },
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "linkReaderToExistingBook",
        bookId,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
