import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ZeroFollowingNudge from "./zeroFollowingNudge";

describe("ZeroFollowingNudge", () => {
  it("mostra modal com aviso e recomendações quando aberto", () => {
    render(
      <ZeroFollowingNudge
        isOpen
        onOpenChange={vi.fn()}
        recommendations={[
          {
            readerId: "ana",
            displayName: "Ana",
            avatarSeed: null,
            reason: { kind: "shared_genre", gender: "fantasy" },
            registeredCount: 2,
            overlapStrength: 4,
          },
        ]}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onToggleFollow={vi.fn()}
        pendingUserId={null}
        isTogglePending={false}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Você ainda não segue ninguém" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Também curte Fantasia")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir a Comunidade" }),
    ).toHaveAttribute("href", "/community");
  });

  it("mostra empty sem lista fantasma", () => {
    render(
      <ZeroFollowingNudge
        isOpen
        onOpenChange={vi.fn()}
        recommendations={[]}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onToggleFollow={vi.fn()}
        pendingUserId={null}
        isTogglePending={false}
      />,
    );

    expect(
      screen.getByText(/Em breve haverá outros leitores/),
    ).toBeInTheDocument();
  });

  it("permite continuar sem seguir", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <ZeroFollowingNudge
        isOpen
        onOpenChange={onOpenChange}
        recommendations={[]}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onToggleFollow={vi.fn()}
        pendingUserId={null}
        isTogglePending={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Continuar sem seguir" }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("não renderiza conteúdo quando fechado", () => {
    render(
      <ZeroFollowingNudge
        isOpen={false}
        onOpenChange={vi.fn()}
        recommendations={[]}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onToggleFollow={vi.fn()}
        pendingUserId={null}
        isTogglePending={false}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: "Você ainda não segue ninguém" }),
    ).not.toBeInTheDocument();
  });
});
