import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SchedulePaceDomain } from "../../types/schedulePace.types";
import { SchedulePaceLabel } from "./schedulePaceLabel";

function makePace(
  overrides: Partial<SchedulePaceDomain> = {},
): SchedulePaceDomain {
  const planned = new Date(2026, 7, 10, 12, 0, 0, 0);
  return {
    status: "on_time",
    overdueDays: 0,
    aheadDays: 0,
    plannedEndDate: planned,
    predictedEndDate: planned,
    ...overrides,
  };
}

describe("SchedulePaceLabel", () => {
  it("retorna null quando pace é null", () => {
    const { container } = render(
      <SchedulePaceLabel pace={null} variant="page" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("na página destaca a data, o caption e o status em dia", () => {
    render(<SchedulePaceLabel pace={makePace()} variant="page" />);

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Data prevista de término")).toBeTruthy();
    expect(screen.getByText("10/08/2026")).toBeTruthy();
    expect(screen.getByText("Em dia")).toBeTruthy();
    expect(screen.queryByText(/Atraso de/)).toBeNull();
    expect(
      screen.getByLabelText(/Data prevista de término: 10\/08\/2026/),
    ).toBeTruthy();
  });

  it("mostra Atraso de 2 dias somente quando status é behind", () => {
    render(
      <SchedulePaceLabel
        pace={makePace({
          status: "behind",
          overdueDays: 2,
          predictedEndDate: new Date(2026, 7, 12, 12),
        })}
        variant="page"
      />,
    );

    expect(screen.getByText("12/08/2026")).toBeTruthy();
    expect(screen.getByText("Atrasado")).toBeTruthy();
    expect(screen.getByText("Atraso de 2 dias")).toBeTruthy();
    expect(screen.getByLabelText(/Atraso de 2 dias/)).toBeTruthy();
  });

  it("usa singular em Atraso de 1 dia no card", () => {
    render(
      <SchedulePaceLabel
        pace={makePace({
          status: "behind",
          overdueDays: 1,
          predictedEndDate: new Date(2026, 7, 11, 12),
        })}
        variant="card"
      />,
    );

    expect(screen.getByText("11/08/2026")).toBeTruthy();
    expect(screen.getByText("Atraso de 1 dia")).toBeTruthy();
    expect(screen.queryByText("Atrasado")).toBeNull();
  });

  it("não mostra atraso quando está ahead e não usa termina X dias antes", () => {
    const { container } = render(
      <SchedulePaceLabel
        pace={makePace({
          status: "ahead",
          aheadDays: 1,
          predictedEndDate: new Date(2026, 7, 9, 12),
        })}
        variant="page"
      />,
    );

    expect(screen.queryByText(/Atraso de/)).toBeNull();
    expect(container.textContent).not.toMatch(/termina/i);
    expect(container.textContent).not.toMatch(/dias antes/);
    expect(screen.getByText("Data prevista de término")).toBeTruthy();
    expect(screen.getByText("09/08/2026")).toBeTruthy();
    expect(screen.getByText("Adiantado")).toBeTruthy();
  });

  it("no card omite o caption longo e mostra só a data quando está em dia", () => {
    render(<SchedulePaceLabel pace={makePace()} variant="card" />);

    expect(screen.queryByText("Data prevista de término")).toBeNull();
    expect(screen.getByText("Término")).toBeTruthy();
    expect(screen.getByText("10/08/2026")).toBeTruthy();
    expect(screen.queryByText("Em dia")).toBeNull();
    expect(
      screen.getByLabelText(/Data prevista de término: 10\/08\/2026/),
    ).toBeTruthy();
  });

  it("no card mostra o chip Adiantado e não usa termina X dias antes", () => {
    const { container } = render(
      <SchedulePaceLabel
        pace={makePace({
          status: "ahead",
          aheadDays: 1,
          predictedEndDate: new Date(2026, 7, 9, 12),
        })}
        variant="card"
      />,
    );

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Término")).toBeTruthy();
    expect(screen.getByText("09/08/2026")).toBeTruthy();
    expect(screen.getByText("Adiantado")).toBeTruthy();
    expect(screen.queryByText(/Atraso de/)).toBeNull();
    expect(container.textContent).not.toMatch(/termina/i);
    expect(container.textContent).not.toMatch(/dias antes/);
  });
});
