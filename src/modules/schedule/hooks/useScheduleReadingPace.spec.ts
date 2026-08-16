import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScheduleDomain } from "@/modules/schedule/types/schedule.types";

const { mockGetMany } = vi.hoisted(() => ({
  mockGetMany: vi.fn(),
}));

vi.mock("../services/readingProgress.service", () => ({
  ReadingProgressService: class {
    getMany = mockGetMany;
  },
}));

vi.mock("../utils/getTodayInSaoPaulo", () => ({
  getTodayInSaoPaulo: () => new Date(2026, 7, 5, 12, 0, 0, 0),
}));

import { useScheduleReadingPace } from "./useScheduleReadingPace";

function row(
  date: string,
  completed: boolean,
): ScheduleDomain {
  return {
    owner: "user-1",
    date,
    chapters: "1",
    completed,
  };
}

describe("useScheduleReadingPace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando o cronograma está indefinido", () => {
    const { result } = renderHook(() => useScheduleReadingPace(undefined));
    expect(result.current.pace).toBeNull();
  });

  it("retorna null quando o cronograma está vazio", () => {
    const { result } = renderHook(() => useScheduleReadingPace([]));
    expect(result.current.pace).toBeNull();
  });

  it("marca ahead e antecipa a data prevista ao ler o dia de amanhã", () => {
    const schedule: ScheduleDomain[] = [
      row("01/08/2026", true),
      row("02/08/2026", true),
      row("03/08/2026", true),
      row("04/08/2026", true),
      row("05/08/2026", true),
      row("06/08/2026", true),
      row("07/08/2026", false),
      row("08/08/2026", false),
      row("09/08/2026", false),
      row("10/08/2026", false),
    ];

    const { result } = renderHook(() => useScheduleReadingPace(schedule));

    expect(result.current.pace?.status).toBe("ahead");
    expect(result.current.pace?.aheadDays).toBe(1);
    expect(result.current.pace?.predictedEndDate.getDate()).toBe(9);
    expect(result.current.pace?.predictedEndDate.getMonth()).toBe(7);
    expect(mockGetMany).not.toHaveBeenCalled();
  });

  it("atualiza status e data prevista ao mudar completed sem novo fetch", () => {
    const onTime: ScheduleDomain[] = [
      row("01/08/2026", true),
      row("02/08/2026", true),
      row("03/08/2026", true),
      row("04/08/2026", true),
      row("05/08/2026", true),
      row("06/08/2026", false),
      row("10/08/2026", false),
    ];

    const { result, rerender } = renderHook(
      ({ schedule }) => useScheduleReadingPace(schedule),
      { initialProps: { schedule: onTime } },
    );

    expect(result.current.pace?.status).toBe("on_time");

    const ahead = onTime.map((item) =>
      item.date === "06/08/2026" ? { ...item, completed: true } : item,
    );
    rerender({ schedule: ahead });

    expect(result.current.pace?.status).toBe("ahead");
    expect(result.current.pace?.predictedEndDate.getDate()).toBe(9);
    expect(mockGetMany).not.toHaveBeenCalled();
  });
});
