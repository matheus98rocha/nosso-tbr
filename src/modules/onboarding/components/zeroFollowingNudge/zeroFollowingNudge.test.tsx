import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ZeroFollowingNudge from "./zeroFollowingNudge";

describe("ZeroFollowingNudge", () => {
  it("mostra aviso e recomendações", () => {
    render(
      <ZeroFollowingNudge
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
});
