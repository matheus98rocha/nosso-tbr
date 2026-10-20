import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { BookDomain } from "@/types/books.types";
import type { User } from "@/types/user.types";

import { useReadingNow } from "./useReadingNow";

const { getAll } = vi.hoisted(() => ({
  getAll: vi.fn(),
}));

vi.mock("@/services/books/books.service", () => ({
  BookService: class {
    getAll = getAll;
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));

vi.mock("@/modules/schedule/hooks/useReadingProgressMany", () => ({
  useReadingProgressMany: () => ({
    progressByBookId: new Map(),
    paceByBookId: new Map(),
    isLoading: false,
    isError: false,
  }),
}));

const CURRENT_USER_ID = "11111111-1111-4111-8111-111111111111";
const PARTNER_USER_ID = "22222222-2222-4222-8222-222222222222";

function book(overrides: Partial<BookDomain> = {}): BookDomain {
  return {
    id: "book-shared",
    title: "A Biblioteca da Meia Noite",
    author: "Matt Haig",
    authorIds: [],
    authorNames: [],
    chosen_by: PARTNER_USER_ID,
    pages: 308,
    status: "reading",
    readerIds: [PARTNER_USER_ID, CURRENT_USER_ID],
    readersDisplay: "Emily e Matheus",
    gender: null,
    image_url: "",
    user_id: PARTNER_USER_ID,
    is_reread: false,
    is_favorite: false,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useReadingNow", () => {
  const collective = book();
  const solo = book({
    id: "book-solo",
    title: "Mistborn: O Poço da Ascensão",
    author: "Brandon Sanderson",
    authorIds: [],
    authorNames: [],
    chosen_by: CURRENT_USER_ID,
    pages: 856,
    readerIds: [CURRENT_USER_ID],
    readersDisplay: "Matheus",
    user_id: CURRENT_USER_ID,
  });

  beforeEach(() => {
    getAll.mockReset();
    getAll.mockResolvedValue({ data: [collective, solo], total: 2 });
    useUserStore.setState({
      user: { id: CURRENT_USER_ID } as User,
      sessionReady: true,
    });
  });

  it("busca pela participação e separa a leitura solo", async () => {
    const { result } = renderHook(() => useReadingNow("solo"), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        relationshipUserValues: [CURRENT_USER_ID],
        filters: expect.objectContaining({ status: ["reading"] }),
      }),
    );
    expect(getAll.mock.calls[0]?.[0]).not.toHaveProperty("userId");
    expect(result.current.items[0]?.book.title).toBe(solo.title);
    expect(result.current.shouldRender).toBe(true);
  });

  it("manda a leitura coletiva cadastrada pela outra pessoa para o card coletivo", async () => {
    const { result } = renderHook(() => useReadingNow("collective"), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(result.current.items[0]?.book.title).toBe(collective.title);
    expect(result.current.shouldRender).toBe(true);
  });

  it("esconde o card coletivo quando não há leitura coletiva", async () => {
    getAll.mockResolvedValue({ data: [solo], total: 1 });

    const { result } = renderHook(() => useReadingNow("collective"), { wrapper });

    await waitFor(() => {
      expect(result.current.isFetched).toBe(true);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.shouldRender).toBe(false);
  });
});