import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReadingProgressIndicator } from "./readingProgressIndicator";

describe("ReadingProgressIndicator", () => {
  it("retorna null quando progress é null (variant card)", () => {
    const { container } = render(
      <ReadingProgressIndicator progress={null} variant="card" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("retorna null quando progress é null (variant page)", () => {
    const { container } = render(
      <ReadingProgressIndicator progress={null} variant="page" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza o variant card com barra e valor em porcentagem", () => {
    render(
      <ReadingProgressIndicator
        progress={{ bookId: "b", total: 10, completed: 4, percentage: 40 }}
        variant="card"
      />,
    );
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.queryByText(/4\/10/)).toBeNull();
  });

  it("renderiza o variant page com cabeçalho e contagem em dias", () => {
    render(
      <ReadingProgressIndicator
        progress={{ bookId: "b", total: 12, completed: 5, percentage: 42 }}
        variant="page"
      />,
    );
    expect(screen.getByText("Progresso de leitura")).toBeTruthy();
    expect(screen.getByText(/42%/)).toBeTruthy();
    expect(screen.getByText(/5 de 12 dias lidos/)).toBeTruthy();
  });

  it("usa singular quando há apenas um dia lido", () => {
    render(
      <ReadingProgressIndicator
        progress={{ bookId: "b", total: 1, completed: 1, percentage: 100 }}
        variant="page"
      />,
    );
    expect(screen.getByText(/1 de 1 dia lido/)).toBeTruthy();
  });

  it("expõe label acessível com percentagem e total", () => {
    render(
      <ReadingProgressIndicator
        progress={{ bookId: "b", total: 10, completed: 3, percentage: 30 }}
        variant="card"
      />,
    );
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar.getAttribute("aria-label")).toContain("3 de 10");
    expect(progressbar.getAttribute("aria-label")).toContain("30%");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("30");
    expect(progressbar.getAttribute("aria-valuemin")).toBe("0");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("chama onNavigateToSchedule ao clicar no variant card", async () => {
    const onNavigateToSchedule = vi.fn();
    const user = userEvent.setup();
    render(
      <ReadingProgressIndicator
        progress={{ bookId: "b", total: 10, completed: 3, percentage: 30 }}
        variant="card"
        onNavigateToSchedule={onNavigateToSchedule}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Abrir cronograma — 3 de 10/ }),
    );
    expect(onNavigateToSchedule).toHaveBeenCalledTimes(1);
  });
});
