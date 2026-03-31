import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DatePicker } from "./datePicker";

describe("DatePicker", () => {
  it("renders placeholder when value is undefined", () => {
    render(<DatePicker />);

    expect(
      screen.getByRole("button", { name: /selecione uma data/i }),
    ).toBeInTheDocument();
  });
});
