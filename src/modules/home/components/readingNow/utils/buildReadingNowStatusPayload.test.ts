import { describe, expect, it } from "vitest";

import { buildReadingNowStatusPayload } from "./buildReadingNowStatusPayload";
import type { BookDomain } from "@/types/books.types";

const sampleBook: BookDomain & { id: string } = {
  id: "book-1",
  title: "O Hobbit",
  author: "Tolkien",
  authorId: "author-1",
  chosen_by: "user-1",
  pages: 310,
  status: "reading",
  readerIds: ["user-1"],
  readersDisplay: "Matheus",
  start_date: "2026-08-01",
  planned_start_date: "2026-07-01",
  end_date: null,
  gender: null,
  image_url: "https://books.google.com/cover.jpg",
  user_id: "user-1",
  is_reread: false,
  is_favorite: false,
};

describe("buildReadingNowStatusPayload", () => {
  it("clears end date when pausing a reading book", () => {
    const payload = buildReadingNowStatusPayload(sampleBook, "paused");

    expect(payload.status).toBe("paused");
    expect(payload.start_date).toBe("2026-08-01");
    expect(payload.planned_start_date).toBeNull();
  });

  it("clears reading dates when abandoning", () => {
    const payload = buildReadingNowStatusPayload(sampleBook, "abandoned");

    expect(payload.status).toBe("abandoned");
    expect(payload.start_date).toBeNull();
    expect(payload.end_date).toBeNull();
    expect(payload.planned_start_date).toBeNull();
  });

  it("keeps start date when finishing", () => {
    const payload = buildReadingNowStatusPayload(sampleBook, "finished");

    expect(payload.status).toBe("finished");
    expect(payload.start_date).toBe("2026-08-01");
  });
});
