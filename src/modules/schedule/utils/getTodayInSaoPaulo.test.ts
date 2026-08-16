import { afterEach, describe, expect, it, vi } from "vitest";

import { DateUtils } from "@/utils";

import { getTodayInSaoPaulo } from "./getTodayInSaoPaulo";

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

describe("getTodayInSaoPaulo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mantém o dia 16/08 em São Paulo quando UTC já é 17/08 de madrugada", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-17T02:30:00.000Z"));

    expectCalendarNoon(getTodayInSaoPaulo(), "2026-08-16");
  });

  it("usa 17/08 depois da meia-noite em America/Sao_Paulo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-17T03:30:00.000Z"));

    expectCalendarNoon(getTodayInSaoPaulo(), "2026-08-17");
  });

  it("usa o dia calendário de São Paulo no meio do dia local", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T15:00:00.000Z"));

    expectCalendarNoon(getTodayInSaoPaulo(), "2026-08-16");
  });
});
