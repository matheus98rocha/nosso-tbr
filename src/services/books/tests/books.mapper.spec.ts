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
      status: "not_started",
    };

    const domain = BookMapper.toDomain(persistence);

    expect(domain.title).toBe("O Hobbit");
    expect(domain.author).toBe("J.R.R. Tolkien");
    expect(domain.status).toBe("not_started");
  });

  it("deve usar status paused sem inferir por datas", () => {
    const persistence: Partial<BookPersistence> = {
      status: "paused",
      start_date: "2024-01-01",
      end_date: null,
      author: { name: "Autor" },
      readers: ["Matheus"],
    };

    const domain = BookMapper.toDomain(persistence as BookPersistence);
    expect(domain.status).toBe("paused");
  });

  it("deve usar status abandoned sem inferir por datas", () => {
    const persistence: Partial<BookPersistence> = {
      status: "abandoned",
      start_date: "2024-01-01",
      end_date: null,
      author: { name: "Autor" },
      readers: ["Matheus"],
    };

    const domain = BookMapper.toDomain(persistence as BookPersistence);
    expect(domain.status).toBe("abandoned");
  });

  it("deve cair para not_started quando status vier vazio", () => {
    const persistence: Partial<BookPersistence> = {
      status: undefined,
      start_date: "2024-01-01",
      end_date: "2024-01-10",
      author: { name: "Autor" },
      readers: ["Matheus"],
    };

    const domain = BookMapper.toDomain(persistence as BookPersistence);
    expect(domain.status).toBe("not_started");
  });
});
