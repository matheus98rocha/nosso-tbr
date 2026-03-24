import { createClient } from "@/lib/supabase/client";
import { BookCreateValidator, Status } from "@/types/books.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { BookUpsertMapper } from "./mappers/bookUpsert.mapper";
import { BookQueryBuilder } from "@/services/books/bookQuery.builder";

const NON_CREATABLE_STATUSES: Status[] = ["paused", "abandoned"];
const TRANSITION_LOCKED_STATUSES: Status[] = ["paused", "abandoned"];

export class BookUpsertService {
  private supabase = createClient();

  private ensureCreatableStatus(status?: Status) {
    if (status && NON_CREATABLE_STATUSES.includes(status)) {
      throw new RepositoryError(
        "Livros não podem ser criados com status pausado ou abandonado.",
      );
    }
  }

  private async getCurrentBook(id: string) {
    const { data, error } = await this.supabase
      .from("books")
      .select("id,status,start_date,end_date")
      .eq("id", id)
      .single();

    if (error) {
      throw new RepositoryError(
        "Falha ao carregar estado atual do livro",
        undefined,
        undefined,
        error,
        { id },
      );
    }

    return data;
  }

  private validateTransition(
    currentBook: { status?: Status; start_date?: string | null },
    nextStatus?: Status,
    nextStartDate?: string | null,
  ) {
    if (nextStatus && TRANSITION_LOCKED_STATUSES.includes(nextStatus)) {
      if (currentBook.status !== "reading") {
        throw new RepositoryError(
          "Status pausado e abandonado só podem ser aplicados a livros em andamento.",
          400,
        );
      }
    }

    if (currentBook.status === "abandoned" && nextStatus === "reading" && !nextStartDate) {
      throw new RepositoryError(
        "Para retomar um livro abandonado, informe uma nova data de início.",
        400,
      );
    }
  }

  async create(book: BookCreateValidator): Promise<{ id: string }> {
    try {
      this.ensureCreatableStatus(book.status);

      const payload = BookUpsertMapper.toPersistence(book);
      const { data, error } = await this.supabase
        .from("books")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        throw new RepositoryError(
          "Falha ao criar livro",
          undefined,
          undefined,
          error,
          { book },
        );
      }

      if (!data?.id) {
        throw new RepositoryError(
          "Livro criado, mas ID não retornado.",
          undefined,
          undefined,
          undefined,
          { book },
        );
      }

      return { id: data.id };
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
      const currentBook = await this.getCurrentBook(id);
      this.validateTransition(
        currentBook as { status?: Status; start_date?: string | null },
        book.status,
        book.start_date,
      );

      const payload = BookUpsertMapper.toPersistence(book);

      if (book.status === "paused") {
        payload.start_date = currentBook?.start_date ?? payload.start_date;
        payload.end_date = currentBook?.end_date ?? payload.end_date;
      }

      if (book.status === "abandoned") {
        payload.start_date = null;
        payload.end_date = null;
      }

      if (currentBook?.status === "paused" && book.status === "reading") {
        payload.start_date = book.start_date ?? currentBook.start_date ?? null;
        payload.end_date = null;
      }

      if (currentBook?.status === "abandoned" && book.status === "reading") {
        payload.end_date = null;
      }

      const { error } = await this.supabase
        .from("books")
        .update(payload)
        .eq("id", id);

      if (error) {
        throw new RepositoryError(
          "Falha ao editar livro",
          undefined,
          undefined,
          error,
          { id, book },
        );
      }
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
}
