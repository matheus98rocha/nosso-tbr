import { createClient } from "@/lib/supabase/client";
import { BookCreateValidator } from "@/types/books.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { BookQueryBuilder } from "@/services/books/bookQuery.builder";
import { ensureCreatableStatus } from "./bookUpsert.validation";
import { apiJson } from "@/lib/api/clientJsonFetch";
import { BookCatalogMatchService } from "./bookCatalogMatch.service";
import {
  BookCatalogCandidate,
  BookCatalogMatchResult,
} from "../types/bookDiscovery.types";


type AuthorJoinRow = {
  name: string | null;
};

type CatalogBookRow = {
  id: string;
  title: string;
  author_id: string;
  readers: unknown;
  image_url: string | null;
  author: AuthorJoinRow | AuthorJoinRow[] | null;
};

function extractAuthorName(author: CatalogBookRow["author"]): string {
  if (Array.isArray(author)) {
    return author[0]?.name ?? "Autor desconhecido";
  }

  return author?.name ?? "Autor desconhecido";
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
      const { data, error } = await this.supabase
        .from("books")
        .select(`id,title,author_id,readers,image_url,author:authors(name)`)
        .eq("author_id", params.authorId)
        .limit(30);

      if (error) {
        throw error;
      }

      const catalogRows = (data ?? []) as CatalogBookRow[];

      const catalogCandidates: BookCatalogCandidate[] = catalogRows.map((row) => ({
        id: row.id,
        title: row.title,
        authorId: row.author_id,
        authorName: extractAuthorName(row.author),
        imageUrl: row.image_url,
        synopsis: null,
        publisher: null,
        readers: Array.isArray(row.readers) ? row.readers : [],
      }));

      return this.catalogMatchService.findBestMatch({
        title: params.title,
        authorId: params.authorId,
        currentUserId: params.currentUserId,
        candidates: catalogCandidates,
      });
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
