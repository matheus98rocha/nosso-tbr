import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DatePicker } from "./datePicker";

describe("DatePicker", () => {
  it("renders placeholder when value is undefined", () => {
    render(<DatePicker />);

    expect(
      screen.getByRole("button", { name: /selecione uma data/i }),
    ).toBeInTheDocument();
  });

  it("permite limpar a data quando há valor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <DatePicker value={new Date(2024, 5, 15)} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Limpar data" }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("não mostra limpar quando não há valor", () => {
    render(<DatePicker />);

    expect(
      screen.queryByRole("button", { name: "Limpar data" }),
    ).not.toBeInTheDocument();
  });
});
