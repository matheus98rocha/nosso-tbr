import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookUpsertService } from "./bookUpsert.service";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/api/clientJsonFetch", () => ({
  apiJson: vi.fn(),
}));

import { apiJson } from "@/lib/api/clientJsonFetch";

const createClientMock = vi.mocked(createClient);
const apiJsonMock = vi.mocked(apiJson);

function buildSupabaseMock() {
  const single = vi.fn();
  const select = vi.fn(() => ({ eq: vi.fn(() => ({ single })) }));

  return {
    from: vi.fn(() => ({
      select,
    })),
    single,
  };
}

const baseBook = {
  id: "book-1",
  title: "Book",
  author_id: "author-1",
  chosen_by: "11111111-1111-4111-8111-111111111111",
  pages: 200,
  readers: ["11111111-1111-4111-8111-111111111111"],
  image_url: "https://amazon.com/image.jpg",
  user_id: "11111111-1111-4111-8111-111111111111",
};

describe("BookUpsertService business rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks create when status is paused", async () => {
    const supabase = buildSupabaseMock();
    createClientMock.mockReturnValue(supabase as never);

    const service = new BookUpsertService();

    await expect(
      service.create({ ...baseBook, status: "paused" }),
    ).rejects.toThrow(/pausado ou abandonado/i);
    expect(apiJsonMock).not.toHaveBeenCalled();
  });

  it("create calls API when status is valid", async () => {
    const supabase = buildSupabaseMock();
    createClientMock.mockReturnValue(supabase as never);
    apiJsonMock.mockResolvedValue({ id: "new-id" });

    const service = new BookUpsertService();
    const result = await service.create({ ...baseBook, status: "reading" });

    expect(result.id).toBe("new-id");
    expect(apiJsonMock).toHaveBeenCalledWith(
      "/api/books",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("edit calls PATCH API", async () => {
    const supabase = buildSupabaseMock();
    createClientMock.mockReturnValue(supabase as never);
    apiJsonMock.mockResolvedValue({ ok: true });

    const service = new BookUpsertService();
    await service.edit("book-1", { ...baseBook, status: "reading" });

    expect(apiJsonMock).toHaveBeenCalledWith(
      "/api/books/book-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});

const ALICE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CAROL = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function buildSupabaseCatalogMock(opts: {
  bookRows: Array<{
    id: string;
    title: string;
    author_id: string;
    chosen_by: string | null;
    status: string | null;
    readers: string[];
    image_url: string | null;
    pages?: number | null;
    author: { name: string | null };
  }>;
  mutualFollowBothWays?: boolean;
  chosenByDisplayName?: string | null;
}) {
  const followersMaybeSingle = vi.fn();
  if (opts.mutualFollowBothWays === true) {
    followersMaybeSingle
      .mockResolvedValueOnce({ data: { follower_id: CAROL } })
      .mockResolvedValueOnce({ data: { follower_id: ALICE } });
  } else if (opts.mutualFollowBothWays === false) {
    followersMaybeSingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null });
  }

  const followersChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: followersMaybeSingle,
  };

  const usersMaybeSingle = vi.fn().mockResolvedValue({
    data:
      opts.chosenByDisplayName === null
        ? null
        : { display_name: opts.chosenByDisplayName ?? "Usuário catálogo" },
  });

  const usersChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: usersMaybeSingle,
  };

  const booksChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    throwOnError: vi.fn().mockResolvedValue({ data: opts.bookRows }),
  };

  const from = vi.fn((table: string) => {
    if (table === "books") return booksChain;
    if (table === "users") return usersChain;
    if (table === "user_followers") return followersChain;
    throw new Error(`unexpected table: ${table}`);
  });

  return { from, followersMaybeSingle, usersMaybeSingle };
}

describe("BookUpsertService.findCatalogBookMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando não há linhas para o autor", async () => {
    const supabase = buildSupabaseCatalogMock({ bookRows: [] });
    createClientMock.mockReturnValue({ from: supabase.from } as never);

    const service = new BookUpsertService();
    const result = await service.findCatalogBookMatch({
      title: "Qualquer",
      authorId: "auth-1",
      currentUserId: CAROL,
    });

    expect(result).toBeNull();
  });

  it("retorna match com bloqueio e sem consultar seguidores quando usuário é chosen_by", async () => {
    const supabase = buildSupabaseCatalogMock({
      bookRows: [
        {
          id: "b1",
          title: "Livro Catálogo",
          author_id: "auth-1",
          chosen_by: CAROL,
          status: "not_started",
          readers: [],
          image_url: null,
          pages: 320,
          author: { name: "Autor" },
        },
      ],
    });
    createClientMock.mockReturnValue({ from: supabase.from } as never);

    const service = new BookUpsertService();
    const result = await service.findCatalogBookMatch({
      title: "Livro Catálogo",
      authorId: "auth-1",
      currentUserId: CAROL,
    });

    expect(result?.userAlreadyLinked).toBe(true);
    expect(result?.suggestJoinEligible).toBe(false);
    expect(supabase.from).toHaveBeenCalledWith("books");
    expect(supabase.from).not.toHaveBeenCalledWith("user_followers");
  });

  it("marca suggestJoinEligible quando not_started e mútuo seguir com chosen_by", async () => {
    const supabase = buildSupabaseCatalogMock({
      bookRows: [
        {
          id: "b1",
          title: "Livro Catálogo",
          author_id: "auth-1",
          chosen_by: ALICE,
          status: "not_started",
          readers: [],
          image_url: null,
          pages: 320,
          author: { name: "Autor" },
        },
      ],
      mutualFollowBothWays: true,
    });
    createClientMock.mockReturnValue({ from: supabase.from } as never);

    const service = new BookUpsertService();
    const result = await service.findCatalogBookMatch({
      title: "Livro Catálogo",
      authorId: "auth-1",
      currentUserId: CAROL,
    });

    expect(result?.userAlreadyLinked).toBe(false);
    expect(result?.suggestJoinEligible).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith("user_followers");
    expect(supabase.followersMaybeSingle).toHaveBeenCalledTimes(2);
  });

  it("não marca suggestJoin quando status não é not_started", async () => {
    const supabase = buildSupabaseCatalogMock({
      bookRows: [
        {
          id: "b1",
          title: "Livro Catálogo",
          author_id: "auth-1",
          chosen_by: ALICE,
          status: "reading",
          readers: [],
          image_url: null,
          pages: 320,
          author: { name: "Autor" },
        },
      ],
      mutualFollowBothWays: true,
    });
    createClientMock.mockReturnValue({ from: supabase.from } as never);

    const service = new BookUpsertService();
    const result = await service.findCatalogBookMatch({
      title: "Livro Catálogo",
      authorId: "auth-1",
      currentUserId: CAROL,
    });

    expect(result?.suggestJoinEligible).toBe(false);
  });

  it("não marca suggestJoin quando falta mútuo seguir", async () => {
    const supabase = buildSupabaseCatalogMock({
      bookRows: [
        {
          id: "b1",
          title: "Livro Catálogo",
          author_id: "auth-1",
          chosen_by: ALICE,
          status: "not_started",
          readers: [],
          image_url: null,
          pages: 320,
          author: { name: "Autor" },
        },
      ],
      mutualFollowBothWays: false,
    });
    createClientMock.mockReturnValue({ from: supabase.from } as never);

    const service = new BookUpsertService();
    const result = await service.findCatalogBookMatch({
      title: "Livro Catálogo",
      authorId: "auth-1",
      currentUserId: CAROL,
    });

    expect(result?.suggestJoinEligible).toBe(false);
  });

  it("retorna null quando authorId está vazio", async () => {
    const supabase = buildSupabaseCatalogMock({ bookRows: [] });
    createClientMock.mockReturnValue({ from: supabase.from } as never);

    const service = new BookUpsertService();
    const result = await service.findCatalogBookMatch({
      title: "X",
      authorId: "",
      currentUserId: CAROL,
    });

    expect(result).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
