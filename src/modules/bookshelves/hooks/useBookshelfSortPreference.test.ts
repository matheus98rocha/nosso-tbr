import { describe, expect, it } from "vitest";
import { parseBookshelfUrlSort } from "./useBookshelfSortPreference";

describe("parseBookshelfUrlSort", () => {
  it("parses shelf and page sort tokens", () => {
    expect(parseBookshelfUrlSort(null)).toBe(undefined);
    expect(parseBookshelfUrlSort("")).toBe(undefined);
    expect(parseBookshelfUrlSort("pages_asc")).toBe("pages_asc");
    expect(parseBookshelfUrlSort("start_date_desc")).toBe("start_date_desc");
    expect(parseBookshelfUrlSort("end_date_asc")).toBe("end_date_asc");
  });

  it("returns undefined for unknown values", () => {
    expect(parseBookshelfUrlSort("bogus")).toBe(undefined);
  });
});
