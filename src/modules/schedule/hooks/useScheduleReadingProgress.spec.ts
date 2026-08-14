import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ScheduleDomain } from "@/modules/schedule/types/schedule.types";
import { useScheduleReadingProgress } from "./useScheduleReadingProgress";

describe("useScheduleReadingProgress", () => {
  it("retorna null quando o cronograma está indefinido", () => {
    const { result } = renderHook(() =>
      useScheduleReadingProgress("book-1", undefined),
    );
    expect(result.current.progress).toBeNull();
  });

  it("retorna null quando o cronograma está vazio", () => {
    const { result } = renderHook(() =>
      useScheduleReadingProgress("book-1", []),
    );
    expect(result.current.progress).toBeNull();
  });

  it("calcula progresso derivado das linhas marcadas como lidas", () => {
    const schedule: ScheduleDomain[] = [
      { owner: "u1", date: "2025-01-01", chapters: "1", completed: true },
      { owner: "u1", date: "2025-01-02", chapters: "2", completed: false },
      { owner: "u1", date: "2025-01-03", chapters: "3", completed: true },
      { owner: "u1", date: "2025-01-04", chapters: "4", completed: false },
    ];
    const { result } = renderHook(() =>
      useScheduleReadingProgress("book-1", schedule),
    );
    expect(result.current.progress).toEqual({
      bookId: "book-1",
      total: 4,
      completed: 2,
      percentage: 50,
    });
  });

  it("retorna 100% quando todas as linhas estão completas", () => {
    const schedule: ScheduleDomain[] = [
      { owner: "u1", date: "2025-01-01", chapters: "1", completed: true },
      { owner: "u1", date: "2025-01-02", chapters: "2", completed: true },
    ];
    const { result } = renderHook(() =>
      useScheduleReadingProgress("book-1", schedule),
    );
    expect(result.current.progress?.percentage).toBe(100);
  });
});
