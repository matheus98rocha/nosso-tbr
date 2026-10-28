import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./index";

const { getRegistrationMode } = vi.hoisted(() => ({
  getRegistrationMode: vi.fn(),
}));

vi.mock("@/services/registration", () => ({
  getRegistrationMode,
}));

vi.mock("@/modules/auth/actions/login", () => ({
  loginAction: vi.fn(),
}));

function renderLogin() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return render(<LoginPage />, { wrapper: Wrapper });
}

describe("LoginPage", () => {
  beforeEach(() => {
    getRegistrationMode.mockReset();
  });

  it("mostra criar conta quando as inscrições estão abertas", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "open" });

    renderLogin();

    expect(await screen.findByRole("link", { name: "Criar conta" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("esconde criar conta quando a inscrição é por convite", async () => {
    getRegistrationMode.mockResolvedValue({ mode: "invite" });

    renderLogin();

    expect(await screen.findByRole("button", { name: "Forgot password" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Criar conta" })).not.toBeInTheDocument();
  });

  it("esconde criar conta quando o modo de inscrição não carrega", async () => {
    getRegistrationMode.mockRejectedValue(new Error("offline"));

    renderLogin();

    expect(await screen.findByRole("button", { name: "Forgot password" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Criar conta" })).not.toBeInTheDocument();
  });
});
