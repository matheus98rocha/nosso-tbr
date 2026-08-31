import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NavSkeleton } from "./navSkeleton";

describe("NavSkeleton", () => {
  it("renderiza nav com aria-hidden=true", () => {
    render(<NavSkeleton />);

    const nav = screen.getByRole("navigation", { hidden: true });
    expect(nav).toHaveAttribute("aria-hidden", "true");
  });

  it("usa estrutura semântica nav > ul > li", () => {
    render(<NavSkeleton />);

    const nav = screen.getByRole("navigation", { hidden: true });
    const list = within(nav).getByRole("list", { hidden: true });
    const items = within(list).getAllByRole("listitem", { hidden: true });

    expect(list).toBeInTheDocument();
    expect(items).toHaveLength(4);
  });

  it("inclui classe desktop-nav no nav", () => {
    render(<NavSkeleton />);

    const nav = screen.getByRole("navigation", { hidden: true });
    expect(nav.className).toMatch(/desktop-nav/);
  });

  it("aplica desktop-nav__link em cada placeholder de item", () => {
    render(<NavSkeleton />);

    const nav = screen.getByRole("navigation", { hidden: true });
    const placeholders = within(nav)
      .getAllByRole("listitem", { hidden: true })
      .map((li) => li.querySelector(".desktop-nav__link"));

    expect(placeholders).toHaveLength(4);
    placeholders.forEach((placeholder) => {
      expect(placeholder).toBeInTheDocument();
    });
  });
});
