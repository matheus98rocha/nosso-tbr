import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ErrorComponent from "./error";

describe("ErrorComponent", () => {
  it("renders the retry control with an accessible label", () => {
    render(<ErrorComponent />);

    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
