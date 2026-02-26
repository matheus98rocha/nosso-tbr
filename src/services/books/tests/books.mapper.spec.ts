import { describe, it, expect } from "vitest";
import { BookMapper } from "../books.mapper";
import { BookPersistence } from "@/types/books.types";

describe("BookMapper", () => {
  it("deve mapear corretamente os dados de persistência para o domínio", () => {
    const persistence: BookPersistence = {
      id: "1",
      title: "O Hobbit",
      author: { name: "J.R.R. Tolkien" },
      author_id: "auth-123",
      chosen_by: "Matheus",
      pages: 300,
      readers: ["Matheus"],
      gender: "Fantasia",
      image_url: "https://amazon.com/hobbit.jpg",
      user_id: "user-456",
    };

    const domain = BookMapper.toDomain(persistence);

    expect(domain.title).toBe("O Hobbit");
    expect(domain.author).toBe("J.R.R. Tolkien");
    expect(domain.status).toBe("not_started");
  });

  it('deve definir o status como "reading" quando houver start_date e não houver end_date', () => {
    const persistence: Partial<BookPersistence> = {
      start_date: "2024-01-01",
      end_date: null,
      author: { name: "Autor" },
      readers: ["Matheus"],
    };

    const domain = BookMapper.toDomain(persistence as BookPersistence);
    expect(domain.status).toBe("reading");
  });

  it('deve definir o status como "finished" quando houver end_date', () => {
    const persistence: Partial<BookPersistence> = {
      start_date: "2024-01-01",
      end_date: "2024-01-10",
      author: { name: "Autor" },
      readers: ["Matheus"],
    };

    const domain = BookMapper.toDomain(persistence as BookPersistence);
    expect(domain.status).toBe("finished");
  });
});
