import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/clientJsonFetch";

import type { AdminUserListItem } from "../types/admin.types";
import useAdmin from "./useAdmin";

const {
  authState,
  replace,
  getAdminUsers,
  getAdminInvites,
  getRegistrationMode,
  updateRegistrationMode,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  authState: {
    isLoggedIn: true,
    isAdmin: true,
    userId: "admin-1" as string | null,
  },
  replace: vi.fn(),
  getAdminUsers: vi.fn(),
  getAdminInvites: vi.fn(),
  getRegistrationMode: vi.fn(),
  updateRegistrationMode: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => authState.isLoggedIn,
  useIsAdmin: () => authState.isAdmin,
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: (
    selector: (state: { user: { id: string } | null }) => unknown,
  ) => selector({ user: authState.userId ? { id: authState.userId } : null }),
}));

vi.mock("@/services/registration", () => ({
  getRegistrationMode,
}));

vi.mock("../services/admin.service", () => ({
  createAdminInvite: vi.fn(),
  deleteAdminUser: vi.fn(),
  getAdminInvites,
  getAdminUsers,
  promoteAdminUser: vi.fn(),
  updateRegistrationMode,
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

function user(overrides: Partial<AdminUserListItem> = {}): AdminUserListItem {
  return {
    id: "reader-2",
    display_name: "Bia",
    email: null,
    tier: "common_user",
    books_count: 0,
    last_sign_in_at: null,
    ...overrides,
  };
}

describe("useAdmin", () => {
  beforeEach(() => {
    authState.isLoggedIn = true;
    authState.isAdmin = true;
    authState.userId = "admin-1";
    replace.mockReset();
    getAdminUsers.mockReset();
    getAdminInvites.mockReset();
    getRegistrationMode.mockReset();
    updateRegistrationMode.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    getAdminUsers.mockResolvedValue([]);
    getAdminInvites.mockResolvedValue({ invites: [] });
    getRegistrationMode.mockResolvedValue({ mode: "invite" });
    updateRegistrationMode.mockResolvedValue({ mode: "open" });
  });

  it("manda quem não está logado para entrar e não carrega a administração", async () => {
    authState.isLoggedIn = false;
    authState.isAdmin = true;

    renderHook(() => useAdmin(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/auth");
    });
    expect(replace).not.toHaveBeenCalledWith("/");
    expect(getAdminUsers).not.toHaveBeenCalled();
    expect(getAdminInvites).not.toHaveBeenCalled();
    expect(getRegistrationMode).not.toHaveBeenCalled();
  });

  it("manda quem não é administrador para a home e não carrega a administração", async () => {
    authState.isAdmin = false;

    renderHook(() => useAdmin(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
    expect(replace).not.toHaveBeenCalledWith("/auth");
    expect(getAdminUsers).not.toHaveBeenCalled();
    expect(getRegistrationMode).not.toHaveBeenCalled();
  });

  it("carrega usuários e descreve o modo de convite para o administrador", async () => {
    getAdminUsers.mockResolvedValue([
      user({ id: "admin-1", tier: "admin", display_name: "Admin" }),
      user(),
    ]);

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.users).toHaveLength(2);
    });
    expect(replace).not.toHaveBeenCalled();
    expect(result.current.registrationMode).toBe("invite");
    expect(result.current.registrationModeDescription).toBe(
      "Só entra quem recebe um convite válido por 24 horas.",
    );
    expect(result.current.inviteSectionDescription).toBe(
      "Cada link permite múltiplos cadastros até expirar. Gere um novo quando precisar convidar alguém.",
    );
    expect(result.current.openRegistrationUrl).toBe(
      `${window.location.origin}/register`,
    );
  });

  it("descreve inscrições abertas e o link deixa de ser obrigatório", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "open" });

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.registrationMode).toBe("open");
    });
    expect(result.current.registrationModeDescription).toBe(
      "Qualquer pessoa pode criar uma conta. O link abaixo abre a inscrição sem convite.",
    );
    expect(result.current.inviteSectionDescription).toBe(
      "As inscrições estão abertas, então o link de convite não é obrigatório. Esses links voltam a ser exigidos se você mudar para Convites, enquanto não expirarem.",
    );
  });

  it("não altera o modo quando a escolha já está ativa", async () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.registrationMode).toBe("invite");
    });

    act(() => {
      result.current.setRegistrationMode("invite");
    });

    expect(updateRegistrationMode).not.toHaveBeenCalled();
  });

  it("ignora um segundo clique enquanto a troca de modo está em andamento", async () => {
    updateRegistrationMode.mockImplementation(
      () => new Promise(() => undefined),
    );

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.registrationMode).toBe("invite");
    });

    act(() => {
      result.current.setRegistrationMode("open");
    });

    await waitFor(() => {
      expect(result.current.isUpdatingRegistration).toBe(true);
    });

    act(() => {
      result.current.setRegistrationMode("invite");
    });

    expect(updateRegistrationMode).toHaveBeenCalledTimes(1);
    expect(updateRegistrationMode.mock.calls[0]?.[0]).toBe("open");
  });

  it("grava inscrições abertas e mantém o modo novo no cache", async () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.registrationMode).toBe("invite");
    });

    act(() => {
      result.current.setRegistrationMode("open");
    });

    await waitFor(() => {
      expect(result.current.registrationMode).toBe("open");
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "Inscrições abertas. Qualquer pessoa pode se cadastrar.",
    );
    expect(toastError).not.toHaveBeenCalled();
  });

  it("mostra a mensagem da API e conserva o modo quando a troca falha", async () => {
    updateRegistrationMode.mockRejectedValue(
      new ApiError("Serviço indisponível", 503),
    );

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.registrationMode).toBe("invite");
    });

    act(() => {
      result.current.setRegistrationMode("open");
    });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Serviço indisponível");
    });
    expect(result.current.registrationMode).toBe("invite");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("usa a mensagem genérica quando a falha não é da API", async () => {
    updateRegistrationMode.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.registrationMode).toBe("invite");
    });

    act(() => {
      result.current.setRegistrationMode("open");
    });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Não foi possível alterar o modo de inscrição.",
      );
    });
    expect(result.current.registrationMode).toBe("invite");
  });

  it("deixa a descrição vazia quando o modo não carrega", async () => {
    getRegistrationMode.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.registrationError).toBe(true);
    });
    expect(result.current.registrationMode).toBeNull();
    expect(result.current.registrationModeDescription).toBe("");
  });

  it("impede excluir a si mesmo e promover quem já é administrador", async () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    const self = user({ id: "admin-1", tier: "admin" });
    const reader = user({ id: "reader-2", tier: "common_user" });

    expect(result.current.canDeleteUser(self)).toBe(false);
    expect(result.current.canDeleteUser(reader)).toBe(true);
    expect(result.current.canPromoteUser(self)).toBe(false);
    expect(result.current.canPromoteUser(reader)).toBe(true);
  });
});
