import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FollowRecommendationRow from "./followRecommendationRow";

describe("FollowRecommendationRow", () => {
  it("mostra motivo de gênero e permite seguir", async () => {
    const user = userEvent.setup();
    const onToggleFollow = vi.fn();

    render(
      <FollowRecommendationRow
        recommendation={{
          readerId: "ana",
          displayName: "Ana",
          avatarSeed: null,
          reason: { kind: "shared_genre", gender: "fantasy" },
          registeredCount: 2,
          overlapStrength: 4,
        }}
        isToggleBusy={false}
        onToggleFollow={onToggleFollow}
      />,
    );

    expect(screen.getByText("Também curte Fantasia")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Seguir Ana" }));
    expect(onToggleFollow).toHaveBeenCalled();
  });

  it("mostra fallback sem alegar gênero", () => {
    render(
      <FollowRecommendationRow
        recommendation={{
          readerId: "bia",
          displayName: "Bia",
          avatarSeed: null,
          reason: { kind: "active_reader" },
          registeredCount: 8,
          overlapStrength: 0,
        }}
        isToggleBusy={false}
        onToggleFollow={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Leitor ativo na comunidade"),
    ).toBeInTheDocument();
  });
});
