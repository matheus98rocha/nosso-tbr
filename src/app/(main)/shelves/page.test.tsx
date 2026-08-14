import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";

import ShelvesPage from "./page";

import type { User } from "@/types/user.types";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";
import { presetNextNavigationShelvesList } from "@/test";

vi.mock("@/services/books/books.service", () => ({
  BookService: vi.fn(function BookServiceStub() {
    return {
      getAll: vi.fn().mockResolvedValue({ data: [] }),
    };
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(),
}));

const mockUser = { id: "user-1" } as unknown as User;

function stubFetchJson(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    ),
  );
}

function renderShelvesPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<ShelvesPage />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe("ShelvesPage", () => {
  const mockShelveResponse = [
    { id: "shelf-1", name: "Para ler", books: [] as { id: string }[] },
  ];

  beforeEach(() => {
    vi.unstubAllGlobals();
    presetNextNavigationShelvesList();
    (useIsLoggedIn as Mock).mockReturnValue(true);
    (useUserStore as unknown as Mock).mockImplementation((selector) =>
      selector({
        user: mockUser,
        loading: false,
        error: null,
        isLoggingOut: false,
        setUser: vi.fn(),
        logout: vi.fn(),
      }),
    );
    stubFetchJson(mockShelveResponse);
  });

  it("mantém main com largura máxima e lista de estantes via GET /api/shelves", async () => {
    const { container } = renderShelvesPage();

    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("max-w-7xl");
    expect(screen.getByText("Minhas estantes")).toBeInTheDocument();

    await screen.findByText("Para ler");
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/shelves(?:\?|$)/),
        expect.anything(),
      );
    });
  });

  it("exibe ação de criar estante quando o usuário está autenticado", async () => {
    renderShelvesPage();

    await screen.findByText("Para ler");

    expect(
      screen.getByRole("button", { name: /criar nova estante/i }),
    ).toBeInTheDocument();
  });

  it("não busca estantes e oculta criar estante quando não autenticado (RN18/RN20)", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn());
    (useIsLoggedIn as Mock).mockReturnValue(false);

    renderShelvesPage();

    await waitFor(() => {
      expect(screen.queryByText("Para ler")).not.toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /criar nova estante/i }),
    ).not.toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
