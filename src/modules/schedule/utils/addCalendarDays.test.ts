import { describe, expect, it } from "vitest";

import { DateUtils } from "@/utils";

import { addCalendarDays } from "./addCalendarDays";

function expectCalendarNoon(actual: Date, isoYmd: string) {
  const expected = DateUtils.toDate(isoYmd)!;

  expect(actual).toBeInstanceOf(Date);
  expect(actual.getFullYear()).toBe(expected.getFullYear());
  expect(actual.getMonth()).toBe(expected.getMonth());
  expect(actual.getDate()).toBe(expected.getDate());
  expect(actual.getHours()).toBe(12);
  expect(actual.getMinutes()).toBe(0);
  expect(actual.getSeconds()).toBe(0);
  expect(actual.getMilliseconds()).toBe(0);
}

describe("addCalendarDays", () => {
  it("soma n dias corridos no calendário local", () => {
    const start = DateUtils.toDate("2026-08-10")!;

    expectCalendarNoon(addCalendarDays(start, 2), "2026-08-12");
  });

  it("subtrai n dias corridos quando n é negativo", () => {
    const start = DateUtils.toDate("2026-08-10")!;

    expectCalendarNoon(addCalendarDays(start, -1), "2026-08-09");
  });

  it("vira o mês ao somar 1 dia a 31/01", () => {
    const start = DateUtils.toDate("2026-01-31")!;

    expectCalendarNoon(addCalendarDays(start, 1), "2026-02-01");
  });

  it("preserva o componente de data com hora 12:00 ao somar zero dias", () => {
    const start = DateUtils.toDate("2026-08-10")!;

    expectCalendarNoon(addCalendarDays(start, 0), "2026-08-10");
  });
});
