import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { BlurOverlay } from "./blurOverlay";

describe("BlurOverlay", () => {
  it("renders children when overlay is hidden", () => {
    render(
      <BlurOverlay showOverlay={false}>
        <span>Content</span>
      </BlurOverlay>,
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders default overlay and navigates to auth on button click", async () => {
    const user = userEvent.setup();

    render(
      <BlurOverlay showOverlay>
        <span>Behind</span>
      </BlurOverlay>,
    );

    expect(screen.getByText("Faça login para continuar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(push).toHaveBeenCalledWith("/auth");
  });

  it("renders custom overlay content when provided", () => {
    render(
      <BlurOverlay showOverlay overlayContent={<p>Custom</p>}>
        <span>Behind</span>
      </BlurOverlay>,
    );

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.queryByText("Faça login para continuar")).not.toBeInTheDocument();
  });
});
