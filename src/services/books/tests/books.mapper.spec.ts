import { describe, expect, it } from "vitest";
import { BookMapper } from "../books.mapper";
import { BookPersistence } from "@/types/books.types";
import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

describe("BookMapper", () => {
  it("deve mapear corretamente os dados de persistência para o domínio", () => {
    const persistence: BookPersistence = {
      id: "1",
      title: "O Hobbit",
      author: { name: "J.R.R. Tolkien" },
      author_id: "auth-123",
      chosen_by: "11111111-1111-4111-8111-111111111111",
      pages: 300,
      readers: ["11111111-1111-4111-8111-111111111111"],
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
      readers: ["11111111-1111-4111-8111-111111111111"],
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
      readers: ["11111111-1111-4111-8111-111111111111"],
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
      readers: ["11111111-1111-4111-8111-111111111111"],
    };

    const domain = BookMapper.toDomain(persistence as BookPersistence);
    expect(domain.status).toBe("not_started");
  });

  it("deve usar capa padrão quando image_url for nulo ou vazio (RN04)", () => {
    const withNull: BookPersistence = {
      id: "1",
      title: "Livro",
      author: { name: "Autor" },
      author_id: "a1",
      chosen_by: "11111111-1111-4111-8111-111111111111",
      pages: 100,
      readers: ["11111111-1111-4111-8111-111111111111"],
      gender: null,
      image_url: null,
      user_id: "u1",
    };

    expect(BookMapper.toDomain(withNull).image_url).toBe(
      BOOK_COVER_PLACEHOLDER_SRC,
    );

    const withEmpty: BookPersistence = {
      ...withNull,
      image_url: "",
    };

    expect(BookMapper.toDomain(withEmpty).image_url).toBe(
      BOOK_COVER_PLACEHOLDER_SRC,
    );
  });
});
