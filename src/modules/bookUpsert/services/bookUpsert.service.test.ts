import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookUpsertService } from "./bookUpsert.service";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);

function buildSupabaseMock() {
  const single = vi.fn();
  const updateEq = vi.fn();
  const select = vi.fn(() => ({ eq: vi.fn(() => ({ single })) }));
  const update = vi.fn(() => ({ eq: updateEq }));
  const insert = vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) }));

  return {
    from: vi.fn(() => ({
      select,
      update,
      insert,
    })),
    single,
    update,
    updateEq,
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
  });

  it("allows transition to paused only from reading", async () => {
    const supabase = buildSupabaseMock();
    supabase.single.mockResolvedValue({
      data: {
        id: "book-1",
        status: "reading",
        start_date: "2025-01-01",
        end_date: null,
      },
      error: null,
    });
    supabase.updateEq.mockResolvedValue({ error: null });
    createClientMock.mockReturnValue(supabase as never);

    const service = new BookUpsertService();

    await expect(
      service.edit("book-1", { ...baseBook, status: "paused" }),
    ).resolves.toBeUndefined();
  });

  it("blocks transition to abandoned when current status is not reading", async () => {
    const supabase = buildSupabaseMock();
    supabase.single.mockResolvedValue({
      data: {
        id: "book-1",
        status: "finished",
        start_date: "2025-01-01",
        end_date: "2025-01-10",
      },
      error: null,
    });
    createClientMock.mockReturnValue(supabase as never);

    const service = new BookUpsertService();

    await expect(
      service.edit("book-1", { ...baseBook, status: "abandoned" }),
    ).rejects.toThrow(/só podem ser aplicados/i);
  });

  it("clears dates when status changes to abandoned", async () => {
    const supabase = buildSupabaseMock();

    supabase.single.mockResolvedValue({
      data: {
        id: "book-1",
        status: "reading",
        start_date: "2025-01-01",
        end_date: null,
      },
      error: null,
    });
    supabase.updateEq.mockResolvedValue({ error: null });
    createClientMock.mockReturnValue(supabase as never);

    const service = new BookUpsertService();

    await service.edit("book-1", { ...baseBook, status: "abandoned" });

    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ start_date: null, end_date: null }),
    );
  });

  it("keeps previous start_date when resuming a paused book as reading", async () => {
    const supabase = buildSupabaseMock();

    supabase.single.mockResolvedValue({
      data: {
        id: "book-1",
        status: "paused",
        start_date: "2025-02-15",
        end_date: null,
      },
      error: null,
    });
    supabase.updateEq.mockResolvedValue({ error: null });
    createClientMock.mockReturnValue(supabase as never);

    const service = new BookUpsertService();

    await service.edit("book-1", { ...baseBook, status: "reading", start_date: null });

    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ start_date: "2025-02-15", end_date: null }),
    );
  });

  it("requires a new start_date when resuming an abandoned book as reading", async () => {
    const supabase = buildSupabaseMock();

    supabase.single.mockResolvedValue({
      data: {
        id: "book-1",
        status: "abandoned",
        start_date: null,
        end_date: null,
      },
      error: null,
    });
    createClientMock.mockReturnValue(supabase as never);

    const service = new BookUpsertService();

    await expect(
      service.edit("book-1", { ...baseBook, status: "reading", start_date: null }),
    ).rejects.toThrow(/nova data de início/i);
  });
});
