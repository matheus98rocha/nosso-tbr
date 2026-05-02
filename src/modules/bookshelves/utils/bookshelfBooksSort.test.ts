import { describe, expect, it } from "vitest";
import { applyBookshelfDisplaySort } from "./bookshelfBooksSort";
import type { BookDomain } from "@/types/books.types";

const base = (over: Partial<BookDomain> & { id: string }): BookDomain => ({
  id: over.id,
  title: over.title ?? "T",
  author: "A",
  chosen_by: "u1",
  pages: over.pages ?? 100,
  readerIds: [],
  readersDisplay: "",
  gender: null,
  image_url: "",
  user_id: "u1",
  is_reread: false,
  is_favorite: false,
  start_date: over.start_date ?? null,
  end_date: over.end_date ?? null,
});

describe("applyBookshelfDisplaySort", () => {
  it("orders by start_date ascending (oldest starts first)", () => {
    const a = base({
      id: "1",
      start_date: "2024-01-01T10:00:00.000Z",
    });
    const b = base({
      id: "2",
      start_date: "2025-06-01T10:00:00.000Z",
    });
    const out = applyBookshelfDisplaySort([b, a], "start_date_asc");
    expect(out.map((x) => x.id)).toEqual(["1", "2"]);
  });

  it("orders by start_date descending", () => {
    const a = base({
      id: "1",
      start_date: "2024-01-01T10:00:00.000Z",
    });
    const b = base({
      id: "2",
      start_date: "2025-06-01T10:00:00.000Z",
    });
    const out = applyBookshelfDisplaySort([a, b], "start_date_desc");
    expect(out.map((x) => x.id)).toEqual(["2", "1"]);
  });

  it("orders by end_date ascending and descending", () => {
    const a = base({
      id: "1",
      end_date: "2024-01-01T10:00:00.000Z",
    });
    const b = base({
      id: "2",
      end_date: "2025-06-01T10:00:00.000Z",
    });
    const asc = applyBookshelfDisplaySort([b, a], "end_date_asc");
    expect(asc.map((x) => x.id)).toEqual(["1", "2"]);
    const desc = applyBookshelfDisplaySort([a, b], "end_date_desc");
    expect(desc.map((x) => x.id)).toEqual(["2", "1"]);
  });

  it("places rows without the chosen date after rows with dates", () => {
    const dated = base({
      id: "1",
      start_date: "2024-01-01T10:00:00.000Z",
    });
    const missingStart = base({ id: "2", start_date: null });
    const asc = applyBookshelfDisplaySort([missingStart, dated], "start_date_asc");
    expect(asc.map((x) => x.id)).toEqual(["1", "2"]);
    const noEnd = base({ id: "3", end_date: null });
    const datedEnd = base({
      id: "4",
      end_date: "2024-06-01T10:00:00.000Z",
    });
    const endAsc = applyBookshelfDisplaySort([noEnd, datedEnd], "end_date_desc");
    expect(endAsc.map((x) => x.id)).toEqual(["4", "3"]);
  });

  it("still orders by pages when sort is pages_*", () => {
    const a = base({ id: "1", pages: 50 });
    const b = base({ id: "2", pages: 200 });
    const asc = applyBookshelfDisplaySort([b, a], "pages_asc");
    expect(asc.map((x) => x.id)).toEqual(["1", "2"]);
    const desc = applyBookshelfDisplaySort([a, b], "pages_desc");
    expect(desc.map((x) => x.id)).toEqual(["2", "1"]);
  });

  it("returns same reference order when sort is undefined", () => {
    const books = [
      base({ id: "1", pages: 1 }),
      base({ id: "2", pages: 2 }),
    ];
    expect(applyBookshelfDisplaySort(books, undefined)).toBe(books);
  });
});
