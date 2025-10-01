import { createClient } from "@/lib/supabase/client";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { UsersMapper } from "./users.mapper";
import { UserDomain, UserPersistence } from "../types/users.types";

export class UsersService {
  private supabase = createClient();

  async get(): Promise<UserDomain[]> {
    try {
      const { data, error } = await this.supabase.from("users").select("*");

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar usuários",
          undefined,
          undefined,
          error,
          {}
        );
      }

      if (!data) return [];

      return data.map((row) => UsersMapper.toDomain(row as UserPersistence));
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "QuotesService",
        method: "getQuotesByBook",
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
  // async getById(id: string, book: BookCreateValidator): Promise<void> {
  //   try {
  //     const payload = BookUpsertMapper.toPersistence(book);
  //     const { error } = await this.supabase
  //       .from("books")
  //       .update(payload)
  //       .eq("id", id);

  //     if (error) {
  //       throw new RepositoryError(
  //         "Falha ao editar livro",
  //         undefined,
  //         undefined,
  //         error,
  //         { id, book }
  //       );
  //     }
  //   } catch (error) {
  //     const normalizedError = ErrorHandler.normalize(error, {
  //       service: "BookService",
  //       method: "edit",
  //       id,
  //       book,
  //     });
  //     ErrorHandler.log(normalizedError);
  //     throw normalizedError;
  //   }
  // }
}
