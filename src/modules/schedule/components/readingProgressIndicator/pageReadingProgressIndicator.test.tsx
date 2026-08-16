import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ScheduleDomain } from "../../types/schedule.types";
import { PageReadingProgressIndicator } from "./pageReadingProgressIndicator";

vi.mock("../../utils/getTodayInSaoPaulo", () => ({
  getTodayInSaoPaulo: () => new Date(2026, 7, 5, 12, 0, 0, 0),
}));

function row(date: string, completed: boolean): ScheduleDomain {
  return {
    owner: "user-1",
    date,
    chapters: "1",
    completed,
  };
}

describe("PageReadingProgressIndicator", () => {
  it("mostra data prevista e atraso quando há dias vencidos em aberto", () => {
    const schedule = [
      row("01/08/2026", true),
      row("02/08/2026", true),
      row("03/08/2026", true),
      row("04/08/2026", false),
      row("05/08/2026", false),
      row("10/08/2026", false),
    ];

    const { rerender } = render(
      <PageReadingProgressIndicator bookId="book-1" schedule={schedule} />,
    );

    expect(screen.getByText("Atraso de 2 dias")).toBeTruthy();
    expect(screen.getByText("Data prevista de término")).toBeTruthy();
    expect(screen.getByText("12/08/2026")).toBeTruthy();
    expect(screen.getByText("Atrasado")).toBeTruthy();

    const onTime = schedule.map((item) =>
      item.date === "04/08/2026" || item.date === "05/08/2026"
        ? { ...item, completed: true }
        : item,
    );

    rerender(
      <PageReadingProgressIndicator bookId="book-1" schedule={onTime} />,
    );

    expect(screen.queryByText(/Atraso de/)).toBeNull();
    expect(screen.getByText("Data prevista de término")).toBeTruthy();
    expect(screen.getByText("10/08/2026")).toBeTruthy();
    expect(screen.getByText("Em dia")).toBeTruthy();
  });

  it("mostra Adiantado e antecipa a data quando um dia futuro já foi lido", () => {
    const schedule = [
      row("01/08/2026", true),
      row("02/08/2026", true),
      row("03/08/2026", true),
      row("04/08/2026", true),
      row("05/08/2026", true),
      row("06/08/2026", true),
      row("10/08/2026", false),
    ];

    const { container } = render(
      <PageReadingProgressIndicator bookId="book-1" schedule={schedule} />,
    );

    expect(screen.getByText("Adiantado")).toBeTruthy();
    expect(screen.getByText("09/08/2026")).toBeTruthy();
    expect(screen.queryByText(/Atraso de/)).toBeNull();
    expect(container.textContent).not.toMatch(/termina/i);
    expect(container.textContent).not.toMatch(/dias antes/);
  });

  it("não mostra rótulo de prazo quando o cronograma está vazio", () => {
    render(<PageReadingProgressIndicator bookId="book-1" schedule={[]} />);

    expect(screen.queryByText(/Data prevista de término/)).toBeNull();
    expect(screen.queryByText("Término")).toBeNull();
    expect(screen.queryByText(/Atraso de/)).toBeNull();
  });
});
