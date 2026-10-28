import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { nextNavigationTestState } from "@/test/nextNavigationTestState";

import { useRegisterGate } from "./useRegisterGate";

const { getRegistrationMode } = vi.hoisted(() => ({
  getRegistrationMode: vi.fn(),
}));

vi.mock("@/services/registration", () => ({
  getRegistrationMode,
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

describe("useRegisterGate", () => {
  beforeEach(() => {
    getRegistrationMode.mockReset();
    nextNavigationTestState.searchParamsSerialized = "";
  });

  it("não libera o formulário enquanto o modo ainda não chegou", () => {
    getRegistrationMode.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useRegisterGate(), { wrapper });

    expect(result.current.view).toBe("loading");
    expect(result.current.mode).toBeNull();
  });

  it("trata convite só com espaços como inscrição fechada", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "invite" });
    nextNavigationTestState.searchParamsSerialized = "invite=%20%20";

    const { result } = renderHook(() => useRegisterGate(), { wrapper });

    await waitFor(() => expect(result.current.view).toBe("closed"));
    expect(result.current.inviteToken).toBe("");
    expect(result.current.mode).toBe("invite");
  });

  it("abre o formulário em inscrições abertas mesmo com convite em branco", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "open" });
    nextNavigationTestState.searchParamsSerialized = "invite=%20";

    const { result } = renderHook(() => useRegisterGate(), { wrapper });

    await waitFor(() => expect(result.current.view).toBe("form"));
    expect(result.current.inviteToken).toBe("");
  });

  it("fica em erro quando a resposta não traz um modo", async () => {
    getRegistrationMode.mockResolvedValue({});

    const { result } = renderHook(() => useRegisterGate(), { wrapper });

    await waitFor(() => expect(result.current.view).toBe("error"));
    expect(result.current.mode).toBeNull();
  });
});
