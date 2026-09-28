import { describe, expect, it } from "vitest";

import {
  formatReadingNowDaysLabel,
  formatReadingNowEmptyScheduleLabel,
} from "./formatReadingNowMeta";

describe("formatReadingNowDaysLabel", () => {
  it("returns null when days are unknown", () => {
    expect(formatReadingNowDaysLabel(null)).toBeNull();
  });

  it("labels the first reading day", () => {
    expect(formatReadingNowDaysLabel(1)).toBe("1º dia de leitura");
  });

  it("labels multiple reading days", () => {
    expect(formatReadingNowDaysLabel(13)).toBe("13 dias lendo");
  });
});

describe("formatReadingNowEmptyScheduleLabel", () => {
  it("includes page count when available", () => {
    expect(formatReadingNowEmptyScheduleLabel(310)).toBe(
      "310 páginas · sem cronograma",
    );
  });

  it("falls back when pages are missing", () => {
    expect(formatReadingNowEmptyScheduleLabel(null)).toBe("Sem cronograma");
    expect(formatReadingNowEmptyScheduleLabel(0)).toBe("Sem cronograma");
  });
});
