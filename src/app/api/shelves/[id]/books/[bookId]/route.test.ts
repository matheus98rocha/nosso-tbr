import { describe, expect, it, vi } from "vitest";

import {
  SHELF_BOOK_CANNOT_ADD_MESSAGE,
  SHELF_BOOK_DUPLICATE_CODE,
} from "@/constants/shelfBook";

type ClientMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

function chainMaybeSingle(data: unknown, error: unknown, eqDepth: 1 | 2) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  if (eqDepth === 1) {
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    return { select, eq, maybeSingle };
  }
  const innerEq = vi.fn(() => ({ maybeSingle }));
  const outerEq = vi.fn(() => ({ eq: innerEq }));
  const select = vi.fn(() => ({ eq: outerEq }));
  return { select, outerEq, innerEq, maybeSingle };
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

describe("POST /api/shelves/[id]/books/[bookId]", () => {
  it("returns 409 when book is already on the shelf", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      {
        id: "shelf-1",
        user_id: userId,
      },
      null,
      1,
    );
    const bookBuilder = chainMaybeSingle(
      {
        user_id: userId,
        chosen_by: userId,
        readers: [userId],
      },
      null,
      1,
    );
    const existingBuilder = chainMaybeSingle({ id: "row-1" }, null, 2);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "custom_shelves") return shelfBuilder;
        if (table === "books") return bookBuilder;
        if (table === "custom_shelf_books") return existingBuilder;
        return {};
      }),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }),
      },
    );

    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      error: string;
      code: string;
    };
    expect(body.error).toBe(SHELF_BOOK_CANNOT_ADD_MESSAGE);
    expect(body.code).toBe(SHELF_BOOK_DUPLICATE_CODE);
  });
});
