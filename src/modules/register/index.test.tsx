import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { nextNavigationTestState } from "@/test/nextNavigationTestState";

import ClientRegister from "./index";

const { getRegistrationMode } = vi.hoisted(() => ({
  getRegistrationMode: vi.fn(),
}));

vi.mock("@/services/registration", () => ({
  getRegistrationMode,
}));

function renderRegister() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return render(<ClientRegister />, { wrapper: Wrapper });
}

describe("ClientRegister", () => {
  beforeEach(() => {
    getRegistrationMode.mockReset();
    nextNavigationTestState.searchParamsSerialized = "";
  });

  it("mostra o formulário sem convite quando as inscrições estão abertas", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "open" });

    renderRegister();

    expect(await screen.findByText("Inscrições abertas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
    expect(screen.queryByText("Precisa de um convite")).not.toBeInTheDocument();
  });

  it("pede convite quando as inscrições estão fechadas e não há link", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "invite" });

    renderRegister();

    expect(await screen.findByText("Precisa de um convite")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cadastrar" })).not.toBeInTheDocument();
  });

  it("mostra o formulário com convite quando o modo é convites", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "invite" });
    nextNavigationTestState.searchParamsSerialized = "invite=token-valido";

    renderRegister();

    expect(await screen.findByText("Convite ativo · válido por 24h")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
  });

  it("avisa quando não consegue saber o modo de inscrição", async () => {
    getRegistrationMode.mockRejectedValue(new Error("offline"));

    renderRegister();

    expect(
      await screen.findByText(
        "Não foi possível verificar o modo de inscrição. Atualize a página.",
      ),
    ).toBeInTheDocument();
  });
});
