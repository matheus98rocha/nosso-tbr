import { act, renderHook } from "@testing-library/react";
import type { MouseEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDefaultPagination } from "./useDefaultPagination";

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("(min-width: 640px)"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("useDefaultPagination", () => {
  beforeEach(() => {
    stubMatchMedia();
    vi.spyOn(document, "getElementById").mockReturnValue(null);
  });

  it("sets shouldRender false when totalPages is 1", () => {
    const setCurrentPage = vi.fn();
    const { result } = renderHook(() =>
      useDefaultPagination({
        currentPage: 0,
        totalPages: 1,
        setCurrentPage,
      }),
    );

    expect(result.current.shouldRender).toBe(false);
  });

  it("sets shouldRender true when totalPages is greater than 1", () => {
    const setCurrentPage = vi.fn();
    const { result } = renderHook(() =>
      useDefaultPagination({
        currentPage: 0,
        totalPages: 3,
        setCurrentPage,
      }),
    );

    expect(result.current.shouldRender).toBe(true);
  });

  it("calls setCurrentPage with previous index when previous control is used", () => {
    const setCurrentPage = vi.fn();
    const { result } = renderHook(() =>
      useDefaultPagination({
        currentPage: 2,
        totalPages: 5,
        setCurrentPage,
      }),
    );

    const preventDefault = vi.fn();
    act(() => {
      result.current.handlePreviousClick({
        preventDefault,
      } as unknown as MouseEvent<HTMLAnchorElement>);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(setCurrentPage).toHaveBeenCalledWith(expect.any(Function));
    const updater = setCurrentPage.mock.calls[0][0] as (p: number) => number;
    expect(updater(2)).toBe(1);
  });

  it("does not change page on previous when already on first page", () => {
    const setCurrentPage = vi.fn();
    const { result } = renderHook(() =>
      useDefaultPagination({
        currentPage: 0,
        totalPages: 5,
        setCurrentPage,
      }),
    );

    act(() => {
      result.current.handlePreviousClick({
        preventDefault: vi.fn(),
      } as unknown as MouseEvent<HTMLAnchorElement>);
    });

    expect(setCurrentPage).not.toHaveBeenCalled();
  });

  it("calls setCurrentPage with next index when next control is used", () => {
    const setCurrentPage = vi.fn();
    const { result } = renderHook(() =>
      useDefaultPagination({
        currentPage: 1,
        totalPages: 5,
        setCurrentPage,
      }),
    );

    act(() => {
      result.current.handleNextClick({
        preventDefault: vi.fn(),
      } as unknown as MouseEvent<HTMLAnchorElement>);
    });

    expect(setCurrentPage).toHaveBeenCalledWith(expect.any(Function));
    const updater = setCurrentPage.mock.calls[0][0] as (p: number) => number;
    expect(updater(1)).toBe(2);
  });

  it("exposes one page token per page when total pages is within show-all threshold", () => {
    const setCurrentPage = vi.fn();
    const { result } = renderHook(() =>
      useDefaultPagination({
        currentPage: 0,
        totalPages: 5,
        setCurrentPage,
      }),
    );

    const pageTokens = result.current.tokens.filter((t) => t.type === "page");
    expect(pageTokens).toHaveLength(5);
  });

  it("invokes setCurrentPage when a page token is clicked", () => {
    const setCurrentPage = vi.fn();
    const { result } = renderHook(() =>
      useDefaultPagination({
        currentPage: 0,
        totalPages: 5,
        setCurrentPage,
      }),
    );

    const firstPage = result.current.tokens.find(
      (t) => t.type === "page" && t.page === 2,
    );
    expect(firstPage?.type).toBe("page");
    if (firstPage?.type !== "page") throw new Error("expected page token");

    const preventDefault = vi.fn();
    act(() => {
      firstPage.onClick({
        preventDefault,
      } as unknown as MouseEvent<HTMLAnchorElement>);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(setCurrentPage).toHaveBeenCalledWith(2);
  });

  it("uses custom prev and next labels", () => {
    const setCurrentPage = vi.fn();
    const { result } = renderHook(() =>
      useDefaultPagination({
        currentPage: 0,
        totalPages: 3,
        setCurrentPage,
        prevText: "Back",
        nextText: "Forward",
      }),
    );

    expect(result.current.prevText).toBe("Back");
    expect(result.current.nextText).toBe("Forward");
  });
});
