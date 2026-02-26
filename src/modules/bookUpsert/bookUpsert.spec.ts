import { describe, it, expect } from "vitest";
import { bookCreateSchema } from "../home/validators/createBook.validator";
import { BookUpsertMapper } from "./services/mappers/bookUpsert.mapper";
import { BookCreateValidator } from "@/types/books.types";

function createValidBook(
  overrides?: Partial<BookCreateValidator>,
): BookCreateValidator {
  return {
    id: "book-1",
    title: "Livro de Teste",
    author_id: "author-1",
    chosen_by: "Matheus",
    pages: 100,
    readers: "Matheus",
    image_url: "https://amazon.com/image.jpg",
    gender: "Fantasia",
    user_id: "user-1",
    ...overrides,
  };
}

describe("BookUpsert - campo author", () => {
  it("deve falhar quando author_id estiver vazio", () => {
    const invalidBook = createValidBook({ author_id: "" });

    const result = bookCreateSchema.safeParse(invalidBook);

    expect(result.success).toBe(false);
    if (!result.success) {
      const hasAuthorError = result.error.issues.some(
        (issue) => issue.path[0] === "author_id",
      );
      expect(hasAuthorError).toBe(true);
    }
  });

  it("deve aceitar um author_id não vazio, mesmo que o valor seja inválido no domínio", () => {
    const invalidDomainAuthorId = "autor-inexistente";
    const book = createValidBook({ author_id: invalidDomainAuthorId });

    const result = bookCreateSchema.safeParse(book);

    expect(result.success).toBe(true);

    if (result.success) {
      const persistence = BookUpsertMapper.toPersistence(result.data);
      expect(persistence.author_id).toBe(invalidDomainAuthorId);
    }
  });

  it("deve manter o author_id correto no mapeamento para persistência", () => {
    const validAuthorId = "author-valid-123";
    const result = bookCreateSchema.safeParse(
      createValidBook({ author_id: validAuthorId }),
    );

    expect(result.success).toBe(true);

    if (result.success) {
      const persistence = BookUpsertMapper.toPersistence(result.data);
      expect(persistence.author_id).toBe(validAuthorId);
    }
  });
});
