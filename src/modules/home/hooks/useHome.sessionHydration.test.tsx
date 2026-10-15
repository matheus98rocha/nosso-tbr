import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserProvider } from "@/providers/UserProvider";
import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { useHome } from "./useHome";

const { getAll } = vi.hoisted(() => ({
  getAll: vi.fn(),
}));

vi.mock("@/services/books/books.service", () => ({
  BookService: class {
    getAll = getAll;
  },
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

function HomeProbe() {
  useHome();
  return null;
}

function renderHome(initialUser: User | null) {
  const queryClient = new QueryClient({
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

  return render(
    <QueryClientProvider client={queryClient}>
      <UserProvider
        initialUser={initialUser}
        initialTier={initialUser ? "common_user" : null}
      >
        <HomeProbe />
      </UserProvider>
    </QueryClientProvider>,
  );
}

describe("useHome session hydration", () => {
  beforeEach(() => {
    getAll.mockReset();
    getAll.mockResolvedValue({ data: [], total: 0 });
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
});
