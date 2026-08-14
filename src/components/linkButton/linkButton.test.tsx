import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkButton } from "./linkButton";

describe("LinkButton", () => {
  it("renders a link with the given label", () => {
    render(<LinkButton href="/stats" label="Statistics" />);

    const link = screen.getByRole("link", { name: "Statistics" });
    expect(link).toHaveAttribute("href", "/stats");
  });
});
