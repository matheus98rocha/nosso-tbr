import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PopularReader } from "@/modules/home/types";

import PopularReadersStrip from "./popularReadersStrip";
import PopularReadersReveal from "./popularReadersReveal";

vi.mock("@/modules/profile/components", () => ({
  ProfileAvatar: ({ alt }: { alt?: string }) => <div>{alt}</div>,
}));

const reader: PopularReader = {
  id: "r1",
  displayName: "Ana",
  avatarSeed: "seed",
  followerCount: 3,
  sharedGenderCount: 1,
  sharedAuthorCount: 0,
  score: 6,
  isFollowing: false,
};

describe("PopularReadersStrip", () => {
  it("renders readers and follows on click", async () => {
    const user = userEvent.setup();
    const onFollow = vi.fn();
    const onHide = vi.fn();

    render(
      <PopularReadersStrip
        readers={[reader]}
        isLoading={false}
        isTogglePending={false}
        pendingUserId={null}
        onFollow={onFollow}
        onHide={onHide}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Leitores populares" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 seguidores")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Seguir Ana" }));
    expect(onFollow).toHaveBeenCalledWith("r1");

    await user.click(
      screen.getByRole("button", { name: "Esconder leitores populares" }),
    );
    expect(onHide).toHaveBeenCalled();
  });

  it("shows skeletons while loading", () => {
    const { container } = render(
      <PopularReadersStrip
        readers={[]}
        isLoading
        isTogglePending={false}
        pendingUserId={null}
        onFollow={vi.fn()}
        onHide={vi.fn()}
      />,
    );

    expect(container.querySelectorAll("[class*=animate]").length).toBeGreaterThan(
      0,
    );
  });
});

describe("PopularReadersReveal", () => {
  it("calls onShow", async () => {
    const user = userEvent.setup();
    const onShow = vi.fn();

    render(<PopularReadersReveal onShow={onShow} />);

    await user.click(
      screen.getByRole("button", { name: "Mostrar leitores populares" }),
    );
    expect(onShow).toHaveBeenCalled();
  });
});
