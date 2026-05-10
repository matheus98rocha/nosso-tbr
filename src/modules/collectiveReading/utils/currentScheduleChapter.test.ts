import { describe, expect, it } from "vitest";

import type { ScheduleDomain } from "@/modules/schedule/types/schedule.types";

import { getCurrentScheduleChapterInfo } from "./currentScheduleChapter";

describe("getCurrentScheduleChapterInfo", () => {
  it("retorna null quando não há cronograma", () => {
    expect(getCurrentScheduleChapterInfo(undefined)).toBeNull();
    expect(getCurrentScheduleChapterInfo([])).toBeNull();
  });

  it("retorna o primeiro dia não concluído ordenado por data", () => {
    const schedule: ScheduleDomain[] = [
      {
        id: "1",
        owner: "u",
        date: "2026-05-02T12:00:00.000Z",
        chapters: "1-2",
        completed: true,
      },
      {
        id: "2",
        owner: "u",
        date: "2026-05-01T12:00:00.000Z",
        chapters: "3",
        completed: false,
      },
    ];
    const info = getCurrentScheduleChapterInfo(schedule);
    expect(info?.kind).toBe("active");
    if (info?.kind === "active") {
      expect(info.chaptersLabel).toBe("3");
      expect(info.dateLabel).toBe("01/05/2026");
    }
  });

  it("retorna completed quando todos os dias estão concluídos", () => {
    const schedule: ScheduleDomain[] = [
      {
        id: "1",
        owner: "u",
        date: "2026-05-01T12:00:00.000Z",
        chapters: "1",
        completed: true,
      },
      {
        id: "2",
        owner: "u",
        date: "2026-05-03T12:00:00.000Z",
        chapters: "2",
        completed: true,
      },
    ];
    const info = getCurrentScheduleChapterInfo(schedule);
    expect(info?.kind).toBe("completed");
    if (info?.kind === "completed") {
      expect(info.lastChaptersLabel).toBe("2");
      expect(info.lastDateLabel).toBe("03/05/2026");
    }
  });
});
