import { describe, expect, it } from "vitest";
import { BookCatalogMatchService } from "./bookCatalogMatch.service";

const service = new BookCatalogMatchService();

const candidates = [
  {
    id: "book-1",
    title: "O Senhor dos Anéis",
    authorId: "author-1",
    authorName: "J.R.R. Tolkien",
    imageUrl: null,
    pages: null,
    readers: ["user-1"],
    chosenBy: "user-1" as string | null,
    chosenByDisplayName: null,
    status: "not_started" as const,
  },
  {
    id: "book-2",
    title: "Silmarillion",
    authorId: "author-1",
    authorName: "J.R.R. Tolkien",
    imageUrl: null,
    pages: null,
    readers: [],
    chosenBy: null,
    chosenByDisplayName: null,
    status: "not_started" as const,
  },
];

describe("BookCatalogMatchService", () => {
  it("identifica match exato após normalização", () => {
    const result = service.findBestMatch({
      title: "senhor dos aneis",
      authorId: "author-1",
      currentUserId: "user-2",
      candidates,
    });

    expect(result?.kind).toBe("exact");
    expect(result?.candidate.id).toBe("book-1");
  });

  it("identifica match aproximado por distância", () => {
    const result = service.findBestMatch({
      title: "senhro dos aneis",
      authorId: "author-1",
      currentUserId: "user-2",
      candidates,
    });

    expect(result?.kind).toBe("approximate");
    expect(result?.candidate.id).toBe("book-1");
  });

  it("sinaliza quando usuário já está vinculado no livro encontrado", () => {
    const result = service.findBestMatch({
      title: "o senhor dos aneis",
      authorId: "author-1",
      currentUserId: "user-1",
      candidates,
    });

    expect(result?.userAlreadyLinked).toBe(true);
  });

  it("sinaliza participação quando usuário é chosen_by ainda sem estar em readers", () => {
    const result = service.findBestMatch({
      title: "o senhor dos aneis",
      authorId: "author-1",
      currentUserId: "owner-1",
      candidates: [
        {
          id: "book-owned",
          title: "O Senhor dos Anéis",
          authorId: "author-1",
          authorName: "Tolkien",
          imageUrl: null,
          pages: null,
          readers: ["other-1"],
          chosenBy: "owner-1",
          chosenByDisplayName: null,
          status: "not_started",
        },
      ],
    });

    expect(result?.userAlreadyLinked).toBe(true);
    expect(result?.suggestJoinEligible).toBe(false);
  });
});
