import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RegistrationModeSection from "./registrationModeSection";

const baseProps = {
  mode: "invite" as const,
  isLoading: false,
  isError: false,
  pending: false,
  description: "Só entra quem recebe um convite válido por 24 horas.",
  openRegistrationUrl: "https://nosso-tbr.example/register",
  copied: false,
  onModeChange: vi.fn(),
  onCopyLink: vi.fn(),
};

describe("RegistrationModeSection", () => {
  it("marca convites como modo ativo e troca para inscrições abertas", () => {
    const onModeChange = vi.fn();

    render(
      <RegistrationModeSection {...baseProps} onModeChange={onModeChange} />,
    );

    expect(screen.getByRole("button", { name: "Convites" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Inscrições abertas" }));
    expect(onModeChange).toHaveBeenCalledWith("open");
    expect(screen.queryByText("Link de inscrição")).not.toBeInTheDocument();
  });

  it("mostra o link público quando as inscrições estão abertas", () => {
    const onCopyLink = vi.fn();

    render(
      <RegistrationModeSection
        {...baseProps}
        mode="open"
        description="Qualquer pessoa pode criar uma conta."
        onCopyLink={onCopyLink}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Inscrições abertas" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText("https://nosso-tbr.example/register"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));
    expect(onCopyLink).toHaveBeenCalledTimes(1);
  });

  it("não troca o modo enquanto a alteração está em andamento", () => {
    const onModeChange = vi.fn();

    render(
      <RegistrationModeSection
        {...baseProps}
        pending
        onModeChange={onModeChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Inscrições abertas" }));
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it("mostra erro quando o modo não carrega", () => {
    render(
      <RegistrationModeSection {...baseProps} mode={null} isError />,
    );

    expect(
      screen.getByText("Não foi possível carregar o modo de inscrição."),
    ).toBeInTheDocument();
  });
});
