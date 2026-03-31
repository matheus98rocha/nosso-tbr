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
