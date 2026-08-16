import { renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScheduleProgressBatchContext } from "../context/scheduleProgressBatchContext";
import type { ReadingProgressDomain } from "../types/readingProgress.types";
import type { SchedulePaceDomain } from "../types/schedulePace.types";
import { useBookCardScheduleProgress } from "./useBookCardScheduleProgress";

const mockUseReadingProgressMany = vi.hoisted(() => vi.fn());

vi.mock("./useReadingProgressMany", () => ({
  useReadingProgressMany: mockUseReadingProgressMany,
}));

function makeBatch(overrides: {
  progressByBookId?: Map<string, ReadingProgressDomain>;
  paceByBookId?: Map<string, SchedulePaceDomain>;
  isLoading?: boolean;
  isError?: boolean;
}) {
  return {
    readingBookIds: ["book-1"] as const,
    progressByBookId: overrides.progressByBookId ?? new Map(),
    paceByBookId: overrides.paceByBookId ?? new Map(),
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
  };
}

describe("useBookCardScheduleProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReadingProgressMany.mockReturnValue({
      progressByBookId: new Map(),
      paceByBookId: new Map(),
      isLoading: false,
      isError: false,
    });
  });

  it("com batch da Home usa o mapa do contexto e ignora o fallback", () => {
    const domain: ReadingProgressDomain = {
      bookId: "book-1",
      total: 10,
      completed: 3,
      percentage: 30,
    };
    const batch = makeBatch({
      progressByBookId: new Map([["book-1", domain]]),
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        ScheduleProgressBatchContext.Provider,
        { value: batch },
        children,
      );

    const { result } = renderHook(() => useBookCardScheduleProgress("book-1"), {
      wrapper,
    });

    expect(mockUseReadingProgressMany).toHaveBeenCalledWith([]);
    expect(result.current.progress).toEqual(domain);
    expect(result.current.showNoScheduleCta).toBe(false);
  });

  it("com batch e sem linha do livro indica CTA de criar cronograma", () => {
    const batch = makeBatch({ progressByBookId: new Map() });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        ScheduleProgressBatchContext.Provider,
        { value: batch },
        children,
      );

    const { result } = renderHook(() => useBookCardScheduleProgress("book-1"), {
      wrapper,
    });

    expect(result.current.progress).toBeNull();
    expect(result.current.showNoScheduleCta).toBe(true);
  });

  it("enquanto carrega no batch não mostra CTA", () => {
    const batch = makeBatch({ isLoading: true });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        ScheduleProgressBatchContext.Provider,
        { value: batch },
        children,
      );

    const { result } = renderHook(() => useBookCardScheduleProgress("book-1"), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.showNoScheduleCta).toBe(false);
  });

  it("sem Provider usa useReadingProgressMany com o único bookId", () => {
    const domain: ReadingProgressDomain = {
      bookId: "book-1",
      total: 4,
      completed: 4,
      percentage: 100,
    };
    mockUseReadingProgressMany.mockReturnValue({
      progressByBookId: new Map([["book-1", domain]]),
      paceByBookId: new Map(),
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useBookCardScheduleProgress("book-1"));

    expect(mockUseReadingProgressMany).toHaveBeenCalledWith(["book-1"]);
    expect(result.current.progress).toEqual(domain);
    expect(result.current.pace).toBeNull();
    expect(result.current.showNoScheduleCta).toBe(false);
  });

  it("expõe pace do batch quando o cronograma tem agregados de prazo", () => {
    const domain: ReadingProgressDomain = {
      bookId: "book-1",
      total: 10,
      completed: 5,
      percentage: 50,
    };
    const pace: SchedulePaceDomain = {
      status: "on_time",
      overdueDays: 0,
      aheadDays: 0,
      plannedEndDate: new Date(2026, 7, 10, 12),
      predictedEndDate: new Date(2026, 7, 10, 12),
    };
    const batch = makeBatch({
      progressByBookId: new Map([["book-1", domain]]),
      paceByBookId: new Map([["book-1", pace]]),
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        ScheduleProgressBatchContext.Provider,
        { value: batch },
        children,
      );

    const { result } = renderHook(() => useBookCardScheduleProgress("book-1"), {
      wrapper,
    });

    expect(result.current.pace).toEqual(pace);
    expect(result.current.showNoScheduleCta).toBe(false);
  });
});
