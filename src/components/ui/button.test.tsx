import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders asChild with a single anchor child without throwing", () => {
    render(
      <Button asChild>
        <a href="/test">Label</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Label" });
    expect(link).toHaveAttribute("href", "/test");
  });

  it("does not inject a loader sibling when asChild is true (Radix Slot requires one child)", () => {
    render(
      <Button asChild isLoading>
        <a href="/shelves">Go</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Go" })).toBeInTheDocument();
    expect(document.querySelectorAll(".animate-spin").length).toBe(0);
  });

  it("shows spinner inside a native button when isLoading and not asChild", () => {
    render(<Button isLoading>Save</Button>);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
