import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import CommunityCounts from "./communityCounts";

describe("CommunityCounts", () => {
  it("mostra seguindo, seguidores e mútuos e troca o recorte ao tocar", async () => {
    const user = userEvent.setup();
    const onSelectView = vi.fn();

    render(
      <CommunityCounts
        followingCount={3}
        followerCount={5}
        mutualCount={1}
        activeView="todos"
        onSelectView={onSelectView}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /seguidores/i }));
    expect(onSelectView).toHaveBeenCalledWith("seguidores");

    await user.click(screen.getByRole("button", { name: /seguindo/i }));
    expect(onSelectView).toHaveBeenCalledWith("seguindo");

    await user.click(screen.getByRole("button", { name: /mútuos/i }));
    expect(onSelectView).toHaveBeenCalledWith("mutuos");
  });
});
