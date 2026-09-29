import { createElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Newsreader: () => ({
    variable: "--font-auth-display",
    className: "font-newsreader",
  }),
}));

vi.mock("@/components/header", () => ({
  default: () =>
    createElement("div", { "data-testid": "app-header" }, "header"),
}));

vi.mock("@/providers/UserProvider", () => ({
  UserProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/services/users/service/getCurrentUser.service", () => ({
  getCurrentUserSession: vi.fn().mockResolvedValue(null),
}));

import MainLayout from "./layout";

describe("MainLayout — chrome do header", () => {
  it("renderiza um único Header sem barra de fallback extra", async () => {
    render(
      await MainLayout({
        children: createElement("main", null, "conteúdo"),
      }),
    );

    expect(screen.getAllByTestId("app-header")).toHaveLength(1);
    expect(document.querySelector("header[aria-hidden]")).toBeNull();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
    expect(screen.getByText("conteúdo").parentElement?.className).toContain(
      "pt-36",
    );
    expect(screen.getByText("conteúdo").parentElement?.className).not.toContain(
      "max-lg:pb-28",
    );
  });
});
