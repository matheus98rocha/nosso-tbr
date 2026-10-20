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
  beforeEach(() => {
    getAll.mockReset();
    useUserStore.setState({
      user: { id: CURRENT_USER_ID } as User,
      sessionReady: true,
    });
  });

  it("inclui livros em leitura em que o usuário participa, mesmo cadastrados pela outra pessoa", async () => {
    const shared = book();
    const own = book({
      id: "book-own",
      title: "Mistborn: O Poço da Ascensão",
      author: "Brandon Sanderson",
      chosen_by: CURRENT_USER_ID,
      pages: 856,
      readerIds: [CURRENT_USER_ID],
      readersDisplay: "Matheus",
      user_id: CURRENT_USER_ID,
    });

    getAll.mockResolvedValue({ data: [shared, own], total: 2 });

    const { result } = renderHook(() => useReadingNow(), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        relationshipUserValues: [CURRENT_USER_ID],
        filters: expect.objectContaining({ status: ["reading"] }),
        page: 0,
      }),
    );
    expect(getAll.mock.calls[0]?.[0]).not.toHaveProperty("userId");
    expect(result.current.items.map((item) => item.book.title)).toEqual([
      shared.title,
      own.title,
    ]);
    expect(result.current.hasMultipleBooks).toBe(true);
  });
});
