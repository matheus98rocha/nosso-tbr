import { describe, expect, it } from "vitest";
import type { BookDomain } from "@/types/books.types";
import {
  reorderBooksByIdOrder,
  ShelfBookOrderError,
  validateShelfReorderPayload,
} from "./shelfBookOrder";

const b = (id: string, title: string): BookDomain => ({
  id,
  title,
  author: "A",
  chosen_by: "u",
  pages: 1,
  readerIds: [],
  readersDisplay: "",
  gender: null,
  image_url: "/x.svg",
  user_id: "u",
});

describe("validateShelfReorderPayload", () => {
  it("accepts a valid permutation", () => {
    expect(() =>
      validateShelfReorderPayload(["a", "b"], ["b", "a"]),
    ).not.toThrow();
  });

  it("throws LENGTH_MISMATCH when lengths differ", () => {
    expect(() => validateShelfReorderPayload(["a"], ["a", "b"])).toThrow(
      ShelfBookOrderError,
    );
    try {
      validateShelfReorderPayload(["a"], ["a", "b"]);
    } catch (e) {
      expect(e).toBeInstanceOf(ShelfBookOrderError);
      expect((e as ShelfBookOrderError).code).toBe("LENGTH_MISMATCH");
    }
  });

  it("throws DUPLICATE_TARGET when next order repeats ids", () => {
    expect(() => validateShelfReorderPayload(["a", "b"], ["a", "a"])).toThrow(
      ShelfBookOrderError,
    );
  });

  it("throws DUPLICATE_SOURCE when shelf list repeats ids", () => {
    expect(() => validateShelfReorderPayload(["a", "a"], ["a", "a"])).toThrow(
      ShelfBookOrderError,
    );
  });

  it("throws UNKNOWN_ID when next contains foreign id", () => {
    expect(() => validateShelfReorderPayload(["a"], ["z"])).toThrow(
      ShelfBookOrderError,
    );
  });
});

describe("reorderBooksByIdOrder", () => {
  it("returns books in the given id sequence", () => {
    const books = [b("1", "A"), b("2", "B"), b("3", "C")];
    expect(reorderBooksByIdOrder(books, ["3", "1", "2"]).map((x) => x.id)).toEqual(
      ["3", "1", "2"],
    );
  });

  it("skips unknown ids in the order list", () => {
    const books = [b("1", "A")];
    expect(reorderBooksByIdOrder(books, ["1", "ghost"])).toEqual([b("1", "A")]);
  });
});
