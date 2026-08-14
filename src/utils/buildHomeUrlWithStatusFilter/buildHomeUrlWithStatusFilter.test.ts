import { describe, expect, it } from "vitest";
import { buildHomeUrlWithStatusFilter } from "./buildHomeUrlWithStatusFilter";

describe("buildHomeUrlWithStatusFilter", () => {
  it("builds home URL with the new status filter", () => {
    const params = new URLSearchParams("status=paused&myBooks=true");

    expect(buildHomeUrlWithStatusFilter(params, "reading")).toBe(
      "/?status=reading&myBooks=true",
    );
  });

  it("preserves search query and other filters", () => {
    const params = new URLSearchParams(
      "search=hobbit&status=paused&view=joint&year=2024",
    );

    const url = buildHomeUrlWithStatusFilter(params, "finished");
    const parsed = new URL(url, "http://localhost");

    expect(parsed.pathname).toBe("/");
    expect(parsed.searchParams.get("search")).toBe("hobbit");
    expect(parsed.searchParams.get("status")).toBe("finished");
    expect(parsed.searchParams.get("view")).toBe("joint");
    expect(parsed.searchParams.get("year")).toBe("2024");
  });

  it("clears bookId when navigating to status", () => {
    const params = new URLSearchParams("bookId=book-1&status=paused");

    expect(buildHomeUrlWithStatusFilter(params, "reading")).toBe(
      "/?status=reading",
    );
  });

  it("returns home path when no other filters remain", () => {
    const params = new URLSearchParams("status=paused");

    expect(buildHomeUrlWithStatusFilter(params, "reading")).toBe(
      "/?status=reading",
    );
  });
});
