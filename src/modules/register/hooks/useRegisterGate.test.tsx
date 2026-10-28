import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { nextNavigationTestState } from "@/test/nextNavigationTestState";

import { useRegisterGate } from "./useRegisterGate";

const { getRegistrationMode } = vi.hoisted(() => ({
  getRegistrationMode: vi.fn(),
}));

vi.mock("@/services/registration", () => ({
  getRegistrationMode,
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useRegisterGate", () => {
  beforeEach(() => {
    getRegistrationMode.mockReset();
    nextNavigationTestState.searchParamsSerialized = "";
  });

  it("fica em carregamento até o modo chegar", () => {
    getRegistrationMode.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useRegisterGate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.view).toBe("loading");
    expect(result.current.mode).toBeNull();
  });

  it("trata convite só com espaços como cadastro fechado", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "invite" });
    nextNavigationTestState.searchParamsSerialized = "invite=%20%20";

    const { result } = renderHook(() => useRegisterGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.view).toBe("closed");
    });
    expect(result.current.inviteToken).toBe("");
  });

  it("abre o formulário sem convite quando as inscrições estão abertas", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "open" });

    const { result } = renderHook(() => useRegisterGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.view).toBe("form");
    });
    expect(result.current.inviteToken).toBe("");
  });

  it("entra em erro quando a resposta não traz o modo", async () => {
    getRegistrationMode.mockResolvedValue({});

    const { result } = renderHook(() => useRegisterGate(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.view).toBe("error");
    });
    expect(result.current.mode).toBeNull();
  });
});
