import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BookDomain } from "@/types/books.types";

const {
  mockReplace,
  mockPush,
  mockGetAll,
  mockEdit,
  mockToast,
} = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
  mockGetAll: vi.fn(),
  mockEdit: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams("view=todos"),
}));

vi.mock("sonner", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => true,
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "user-1" } }),
}));

vi.mock("@/hooks", () => ({
  useModal: () => ({
    isOpen: false,
    setIsOpen: vi.fn(),
  }),
}));

vi.mock("@/services/books/books.service", () => ({
  BookService: vi.fn(function BookServiceMock() {
    return { getAll: mockGetAll };
  }),
}));

vi.mock("@/modules/bookUpsert/services/bookUpsert.service", () => ({
  BookUpsertService: vi.fn(function BookUpsertServiceMock() {
    return { edit: mockEdit };
  }),
}));

import { useNextReading } from "./useNextReading";

const plannedBook: BookDomain & { id: string } = {
  id: "book-1",
  title: "Duna",
  author: "Frank Herbert",
  authorId: "author-1",
  chosen_by: "user-1",
  pages: 688,
  status: "planned",
  readerIds: ["user-1"],
  readersDisplay: "Matheus",
  start_date: null,
  planned_start_date: "2026-09-10",
  end_date: null,
  gender: null,
  image_url: "",
  user_id: "user-1",
  is_reread: false,
  is_favorite: false,
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const invalidateSpy = vi.spyOn(client, "invalidateQueries");

  return {
    invalidateSpy,
    Wrapper({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client }, children);
    },
  };
}

describe("useNextReading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue({ data: [plannedBook], count: 1 });
    mockEdit.mockResolvedValue(undefined);
  });

  it("busca com status planned e monta item elegível", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNextReading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.item?.book.id).toBe("book-1");
    });

    expect(mockGetAll).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        page: 0,
        pageSize: 5,
        filters: expect.objectContaining({ status: ["planned"] }),
      }),
    );
    expect(result.current.shouldRender).toBe(true);
  });

  it("shouldRender fica false quando não há elegíveis após fetch", async () => {
    mockGetAll.mockResolvedValue({ data: [], count: 0 });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNextReading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isFetched).toBe(true);
    });

    expect(result.current.item).toBeNull();
    expect(result.current.shouldRender).toBe(false);
  });

  it("confirmStartReading faz PATCH, toast, invalidação e navega para status reading", async () => {
    const { Wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useNextReading(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.item).not.toBeNull();
    });

    act(() => {
      result.current.requestStartReading(plannedBook);
    });

    expect(result.current.pendingStartBook?.id).toBe("book-1");

    await act(async () => {
      result.current.confirmStartReading();
    });

    await waitFor(() => {
      expect(mockEdit).toHaveBeenCalled();
    });

    expect(mockEdit).toHaveBeenCalledWith(
      "book-1",
      expect.objectContaining({
        status: "reading",
        planned_start_date: null,
        end_date: null,
      }),
    );
    expect(mockToast).toHaveBeenCalledWith("Leitura iniciada");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["books"],
      exact: false,
    });
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("status=reading"),
    );
  });
});
