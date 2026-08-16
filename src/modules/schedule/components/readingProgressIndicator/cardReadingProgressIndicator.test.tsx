import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SchedulePaceDomain } from "../../types/schedulePace.types";
import CardReadingProgressIndicator from "./cardReadingProgressIndicator";

const mockUseBookCardScheduleProgress = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useBookCardScheduleProgress", () => ({
  useBookCardScheduleProgress: mockUseBookCardScheduleProgress,
}));

const onNavigateToSchedule = vi.fn();

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

const progressOnTime = {
  bookId: "book-1",
  total: 10,
  completed: 5,
  percentage: 50,
};

describe("CardReadingProgressIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza quando bookId está ausente", () => {
    mockUseBookCardScheduleProgress.mockReturnValue({
      progress: null,
      pace: null,
      isLoading: false,
      isError: false,
      showNoScheduleCta: false,
    });

    const { container } = render(
      <CardReadingProgressIndicator
        bookId={undefined}
        onNavigateToSchedule={onNavigateToSchedule}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("não mostra data prevista enquanto carrega", () => {
    mockUseBookCardScheduleProgress.mockReturnValue({
      progress: null,
      pace: null,
      isLoading: true,
      isError: false,
      showNoScheduleCta: false,
    });

    const { container } = render(
      <CardReadingProgressIndicator
        bookId="book-1"
        onNavigateToSchedule={onNavigateToSchedule}
      />,
    );

    expect(container.querySelector("[aria-busy='true']")).toBeTruthy();
    expect(screen.queryByText(/Data prevista de término/)).toBeNull();
    expect(screen.queryByText("Término")).toBeNull();
    expect(screen.queryByText(/Atraso de/)).toBeNull();
  });

  it("não renderiza rótulo em erro", () => {
    mockUseBookCardScheduleProgress.mockReturnValue({
      progress: null,
      pace: null,
      isLoading: false,
      isError: true,
      showNoScheduleCta: false,
    });

    const { container } = render(
      <CardReadingProgressIndicator
        bookId="book-1"
        onNavigateToSchedule={onNavigateToSchedule}
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/Data prevista de término/)).toBeNull();
    expect(screen.queryByText("Término")).toBeNull();
    expect(screen.queryByText(/Atraso de/)).toBeNull();
  });

  it("mostra CTA de criar cronograma sem data prevista", () => {
    mockUseBookCardScheduleProgress.mockReturnValue({
      progress: null,
      pace: null,
      isLoading: false,
      isError: false,
      showNoScheduleCta: true,
    });

    render(
      <CardReadingProgressIndicator
        bookId="book-1"
        onNavigateToSchedule={onNavigateToSchedule}
      />,
    );

    expect(screen.getByRole("button", { name: /Criar cronograma/ })).toBeTruthy();
    expect(screen.queryByText(/Data prevista de término/)).toBeNull();
    expect(screen.queryByText("Término")).toBeNull();
    expect(screen.queryByText(/Atraso de/)).toBeNull();
  });

  it("mostra data prevista quando há pace", () => {
    mockUseBookCardScheduleProgress.mockReturnValue({
      progress: progressOnTime,
      pace: makePace(),
      isLoading: false,
      isError: false,
      showNoScheduleCta: false,
    });

    render(
      <CardReadingProgressIndicator
        bookId="book-1"
        onNavigateToSchedule={onNavigateToSchedule}
      />,
    );

    expect(screen.getByText("Término")).toBeTruthy();
    expect(screen.getByText("10/08/2026")).toBeTruthy();
    expect(screen.getByLabelText(/Data prevista de término: 10\/08\/2026/)).toBeTruthy();
    expect(screen.queryByText(/Atraso de/)).toBeNull();
  });

  it("não mostra Término quando há progresso mas pace é null", () => {
    mockUseBookCardScheduleProgress.mockReturnValue({
      progress: progressOnTime,
      pace: null,
      isLoading: false,
      isError: false,
      showNoScheduleCta: false,
    });

    render(
      <CardReadingProgressIndicator
        bookId="book-1"
        onNavigateToSchedule={onNavigateToSchedule}
      />,
    );

    expect(screen.queryByText("Término")).toBeNull();
    expect(screen.queryByText("10/08/2026")).toBeNull();
  });

  it("mostra Adiantado no card quando o ritmo está ahead", () => {
    mockUseBookCardScheduleProgress.mockReturnValue({
      progress: progressOnTime,
      pace: makePace({
        status: "ahead",
        aheadDays: 1,
        predictedEndDate: new Date(2026, 7, 9, 12),
      }),
      isLoading: false,
      isError: false,
      showNoScheduleCta: false,
    });

    const { container } = render(
      <CardReadingProgressIndicator
        bookId="book-1"
        onNavigateToSchedule={onNavigateToSchedule}
      />,
    );

    expect(screen.getByText("Término")).toBeTruthy();
    expect(screen.getByText("09/08/2026")).toBeTruthy();
    expect(screen.getByText("Adiantado")).toBeTruthy();
    expect(screen.queryByText(/Atraso de/)).toBeNull();
    expect(container.textContent).not.toMatch(/termina/i);
    expect(container.textContent).not.toMatch(/dias antes/);
  });

  it("mostra Atraso de 1 dia no card sem o chip Atrasado", () => {
    mockUseBookCardScheduleProgress.mockReturnValue({
      progress: progressOnTime,
      pace: makePace({
        status: "behind",
        overdueDays: 1,
        predictedEndDate: new Date(2026, 7, 11, 12),
      }),
      isLoading: false,
      isError: false,
      showNoScheduleCta: false,
    });

    render(
      <CardReadingProgressIndicator
        bookId="book-1"
        onNavigateToSchedule={onNavigateToSchedule}
      />,
    );

    expect(screen.getByText("Término")).toBeTruthy();
    expect(screen.getByText("11/08/2026")).toBeTruthy();
    expect(screen.getByText("Atraso de 1 dia")).toBeTruthy();
    expect(screen.queryByText("Atrasado")).toBeNull();
  });
});
