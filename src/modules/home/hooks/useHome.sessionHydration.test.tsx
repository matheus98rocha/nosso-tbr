import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserProvider } from "@/providers/UserProvider";
import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { useHome } from "./useHome";

const { getAll, signOut } = vi.hoisted(() => ({
  getAll: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/services/books/books.service", () => ({
  BookService: class {
    getAll = getAll;
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut,
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  }),
}));

vi.mock("@/services/users/service/getUsers.service", () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}));

function buildSessionUser(id: string): User {
  return {
    instance_id: "instance",
    id,
    aud: "authenticated",
    role: "authenticated",
    email: `${id}@example.com`,
    encrypted_password: "",
    email_confirmed_at: null,
    invited_at: null,
    confirmation_token: "",
    confirmation_sent_at: null,
    recovery_token: "",
    recovery_sent_at: null,
    email_change_token_new: "",
    email_change: "",
    email_change_sent_at: null,
    last_sign_in_at: null,
    raw_app_meta_data: { provider: "email", providers: ["email"] },
    raw_user_meta_data: { email_verified: true },
    is_super_admin: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    phone: null,
    phone_confirmed_at: null,
    phone_change: "",
    phone_change_token: "",
    phone_change_sent_at: null,
    confirmed_at: null,
    email_change_token_current: "",
    email_change_confirm_status: 0,
    banned_until: null,
    reauthentication_token: "",
    reauthentication_sent_at: null,
    is_sso_user: false,
    deleted_at: null,
    is_anonymous: false,
    providers: ["email"],
  };
}

let homeLoading = false;

function HomeProbe() {
  const { isLoadingAllBooks } = useHome();
  homeLoading = isLoadingAllBooks;
  return null;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
      },
    },
  });
}

function homeTree(queryClient: QueryClient, initialUser: User | null) {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider
        initialUser={initialUser}
        initialTier={initialUser ? "common_user" : null}
      >
        <HomeProbe />
      </UserProvider>
    </QueryClientProvider>
  );
}

function renderHome(initialUser: User | null) {
  return render(homeTree(createQueryClient(), initialUser));
}

describe("useHome session hydration", () => {
  beforeEach(() => {
    homeLoading = false;
    getAll.mockReset();
    getAll.mockResolvedValue({ data: [], total: 0 });
    signOut.mockReset();
    signOut.mockResolvedValue({ error: null });
    useUserStore.setState({
      user: null,
      tier: null,
      loading: false,
      error: null,
      isLoggingOut: false,
      sessionReady: false,
    });
  });

  afterEach(() => {
    useUserStore.setState({
      user: null,
      tier: null,
      loading: false,
      error: null,
      isLoggingOut: false,
      sessionReady: false,
    });
  });

  it("não busca a lista de livros como visitante quando a sessão já veio do servidor", async () => {
    renderHome(buildSessionUser("reader-1"));

    await waitFor(() => {
      expect(getAll).toHaveBeenCalledTimes(1);
    });

    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        relationshipUserValues: ["reader-1"],
        page: 0,
        pageSize: 8,
      }),
    );
  });

  it("busca a lista pública uma vez quando não há sessão", async () => {
    renderHome(null);

    await waitFor(() => {
      expect(getAll).toHaveBeenCalledTimes(1);
    });

    expect(getAll).toHaveBeenCalledWith({
      page: 0,
      pageSize: 8,
    });
  });

  it("não busca a lista pública quando a sessão anterior era visitante e o provider recebe usuário logado", async () => {
    useUserStore.getState().setSession(null, null);

    renderHome(buildSessionUser("reader-1"));

    await waitFor(() => {
      expect(
        getAll.mock.calls.some(
          ([payload]) => payload?.relationshipUserValues?.[0] === "reader-1",
        ),
      ).toBe(true);
    });

    expect(getAll.mock.calls.map(([payload]) => payload)).toEqual([
      expect.objectContaining({
        relationshipUserValues: ["reader-1"],
        page: 0,
        pageSize: 8,
      }),
    ]);
  });

  it("não busca a lista pública quando o mesmo provider troca o visitante pelo usuário logado", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      useUserStore.getState().setSession(null, null);
      const queryClient = createQueryClient();
      const view = render(homeTree(queryClient, null));

      await waitFor(() => {
        expect(getAll).toHaveBeenCalledTimes(1);
      });

      getAll.mockClear();
      consoleError.mockClear();
      view.rerender(homeTree(queryClient, buildSessionUser("reader-1")));

      await waitFor(() => {
        expect(
          getAll.mock.calls.some(
            ([payload]) => payload?.relationshipUserValues?.[0] === "reader-1",
          ),
        ).toBe(true);
      });

      expect(getAll.mock.calls.map(([payload]) => payload)).toEqual([
        expect.objectContaining({
          relationshipUserValues: ["reader-1"],
          page: 0,
          pageSize: 8,
        }),
      ]);
      expect(
        consoleError.mock.calls.some((call) =>
          call.some(
            (part) =>
              typeof part === "string" &&
              part.includes("Cannot update a component"),
          ),
        ),
      ).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("logout conclui com a sessão de visitante pronta", async () => {
    useUserStore.getState().setSession(buildSessionUser("reader-1"), "common_user");

    await useUserStore.getState().logout();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(useUserStore.getState()).toEqual(
      expect.objectContaining({
        user: null,
        tier: null,
        isLoggingOut: false,
        sessionReady: true,
      }),
    );
  });

  it("depois do logout na home busca a lista pública e encerra o carregamento", async () => {
    const user = buildSessionUser("reader-1");
    useUserStore.getState().setSession(user, "common_user");
    render(homeTree(createQueryClient(), user));

    await waitFor(() => {
      expect(getAll).toHaveBeenCalled();
    });

    getAll.mockClear();

    await useUserStore.getState().logout();

    await waitFor(() => {
      expect(getAll).toHaveBeenCalledWith({
        page: 0,
        pageSize: 8,
      });
      expect(homeLoading).toBe(false);
    });
  });
});
