import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ReadingRecapFilters from "./readingRecapFilters";

const defaultProps = {
  filter: {
    period: { kind: "year" as const, year: 2026, month: 10, day: 7 },
    genders: [] as string[],
  },
  anchorDate: new Date(2026, 9, 7, 12),
  monthOptions: [{ value: "10", label: "outubro" }],
  yearOptions: [2026],
  isGenderFilterEnabled: false,
  onPeriodKindChange: vi.fn(),
  onAnchorDateChange: vi.fn(),
  onMonthChange: vi.fn(),
  onYearChange: vi.fn(),
  onToggleGender: vi.fn(),
  onGenderFilterEnabledChange: vi.fn(),
};

describe("ReadingRecapFilters", () => {
  it("mostra Ano, Mês e Dia, com Ano primeiro", () => {
    render(<ReadingRecapFilters {...defaultProps} />);

    const periodButtons = screen
      .getAllByRole("button")
      .filter((button) =>
        ["Ano", "Mês", "Dia"].includes(button.textContent ?? ""),
      );

    expect(periodButtons.map((button) => button.textContent)).toEqual([
      "Ano",
      "Mês",
      "Dia",
    ]);
    expect(screen.getByRole("button", { name: "Ano" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("esconde os gêneros até o leitor habilitar o filtro", async () => {
    const user = userEvent.setup();
    const onGenderFilterEnabledChange = vi.fn();
    render(
      <ReadingRecapFilters
        {...defaultProps}
        onGenderFilterEnabledChange={onGenderFilterEnabledChange}
      />,
    );

    expect(screen.queryByRole("button", { name: "Romance" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filtrar por gênero" }),
    ).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: "Filtrar por gênero" }));
    expect(onGenderFilterEnabledChange).toHaveBeenCalledWith(true);
  });

  it("mostra os gêneros quando o filtro está habilitado", async () => {
    const user = userEvent.setup();
    const onToggleGender = vi.fn();
    render(
      <ReadingRecapFilters
        {...defaultProps}
        isGenderFilterEnabled
        filter={{
          ...defaultProps.filter,
          genders: ["romance"],
        }}
        onToggleGender={onToggleGender}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Filtrar por gênero, 1 selecionado" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Romance" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /^Fantasia$/ }));
    expect(onToggleGender).toHaveBeenCalledWith("fantasy");
  });
});
