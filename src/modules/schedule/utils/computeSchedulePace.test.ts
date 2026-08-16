import { describe, expect, it } from "vitest";

import { DateUtils } from "@/utils";

import {
  computeSchedulePace,
  computeSchedulePaceFromAggregates,
} from "./computeSchedulePace";

const PLAN_DAYS_ISO = [
  "2026-08-01",
  "2026-08-02",
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",
  "2026-08-08",
  "2026-08-09",
  "2026-08-10",
] as const;

const TODAY = DateUtils.toDate("2026-08-05")!;
const LAST_DATE = "2026-08-10";

function rowsFromFlags(completedFlags: readonly boolean[]) {
  return PLAN_DAYS_ISO.map((date, index) => ({
    date,
    completed: completedFlags[index] ?? false,
  }));
}

function expectCalendarDay(actual: Date, isoYmd: string) {
  const expected = DateUtils.toDate(isoYmd)!;

  expect(actual.getFullYear()).toBe(expected.getFullYear());
  expect(actual.getMonth()).toBe(expected.getMonth());
  expect(actual.getDate()).toBe(expected.getDate());
}

describe("computeSchedulePace", () => {
  describe("ausência de cronograma", () => {
    it("retorna null para lista vazia", () => {
      expect(computeSchedulePace([], TODAY)).toBeNull();
    });

    it("retorna null para cronograma nulo ou indefinido", () => {
      expect(computeSchedulePace(null, TODAY)).toBeNull();
      expect(computeSchedulePace(undefined, TODAY)).toBeNull();
    });
  });

  describe("US1 / em dia", () => {
    it("prevê a última data planejada quando os 5 vencidos estão lidos e os futuros não", () => {
      const rows = rowsFromFlags([
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
      ]);

      const pace = computeSchedulePace(rows, TODAY);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("on_time");
      expect(pace!.overdueDays).toBe(0);
      expect(pace!.aheadDays).toBe(0);
      expectCalendarDay(pace!.plannedEndDate, LAST_DATE);
      expectCalendarDay(pace!.predictedEndDate, LAST_DATE);
    });
  });

  describe("US2 / atraso vencido", () => {
    it("marca behind e posterga a data em 2 dias quando há 2 vencidos não lidos", () => {
      const rows = rowsFromFlags([
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ]);

      const pace = computeSchedulePace(rows, TODAY);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("behind");
      expect(pace!.overdueDays).toBe(2);
      expect(pace!.aheadDays).toBe(0);
      expectCalendarDay(pace!.plannedEndDate, LAST_DATE);
      expectCalendarDay(pace!.predictedEndDate, "2026-08-12");
    });

    it("não conta dia futuro não lido como atraso", () => {
      const rows = rowsFromFlags([
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
      ]);

      const pace = computeSchedulePace(rows, TODAY);

      expect(pace).not.toBeNull();
      expect(pace!.overdueDays).toBe(0);
      expect(pace!.status).toBe("on_time");
      expectCalendarDay(pace!.predictedEndDate, LAST_DATE);
    });

    it("fica em dia com atraso 0 quando hoje é anterior à primeira data e não há lidos", () => {
      const todayBeforeStart = DateUtils.toDate("2026-07-31")!;
      const rows = rowsFromFlags([
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ]);

      const pace = computeSchedulePace(rows, todayBeforeStart);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("on_time");
      expect(pace!.overdueDays).toBe(0);
      expect(pace!.aheadDays).toBe(0);
      expectCalendarDay(pace!.predictedEndDate, LAST_DATE);
    });
  });

  describe("US3 / adiantamento", () => {
    it("marca ahead e antecipa 1 dia ao ler o de amanhã com vencidos em dia", () => {
      const rows = rowsFromFlags([
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
      ]);

      const pace = computeSchedulePace(rows, TODAY);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("ahead");
      expect(pace!.overdueDays).toBe(0);
      expect(pace!.aheadDays).toBe(1);
      expectCalendarDay(pace!.plannedEndDate, LAST_DATE);
      expectCalendarDay(pace!.predictedEndDate, "2026-08-09");
    });
  });

  describe("RNxx-06 / misto atraso e adiantamento", () => {
    it("permanece behind e anula os deslocamentos com 1 vencido aberto e 1 futuro lido", () => {
      const rows = rowsFromFlags([
        true,
        true,
        true,
        true,
        false,
        true,
        false,
        false,
        false,
        false,
      ]);

      const pace = computeSchedulePace(rows, TODAY);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("behind");
      expect(pace!.overdueDays).toBe(1);
      expect(pace!.aheadDays).toBe(1);
      expectCalendarDay(pace!.plannedEndDate, LAST_DATE);
      expectCalendarDay(pace!.predictedEndDate, LAST_DATE);
    });
  });

  describe("entrada de datas", () => {
    it("usa a última data planejada mesmo com datas desordenadas", () => {
      const rows = [
        { date: "2026-08-10", completed: false },
        { date: "2026-08-01", completed: true },
        { date: "2026-08-05", completed: true },
        { date: "2026-08-03", completed: true },
        { date: "2026-08-08", completed: false },
        { date: "2026-08-02", completed: true },
        { date: "2026-08-09", completed: false },
        { date: "2026-08-04", completed: true },
        { date: "2026-08-07", completed: false },
        { date: "2026-08-06", completed: false },
      ];

      const pace = computeSchedulePace(rows, TODAY);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("on_time");
      expectCalendarDay(pace!.plannedEndDate, LAST_DATE);
      expectCalendarDay(pace!.predictedEndDate, LAST_DATE);
    });

    it("aceita datas em pt-BR DD/MM/AAAA", () => {
      const rows = PLAN_DAYS_ISO.map((iso, index) => ({
        date: DateUtils.isoToPtBR(iso),
        completed: index < 5,
      }));

      const pace = computeSchedulePace(rows, TODAY);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("on_time");
      expectCalendarDay(pace!.plannedEndDate, LAST_DATE);
    });

    it("aceita datas como Date local", () => {
      const rows = PLAN_DAYS_ISO.map((iso, index) => ({
        date: DateUtils.toDate(iso)!,
        completed: index < 5,
      }));

      const pace = computeSchedulePace(rows, TODAY);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("on_time");
      expectCalendarDay(pace!.plannedEndDate, LAST_DATE);
    });

    it("conta todos os não lidos como atraso quando hoje é depois da última data", () => {
      const todayAfterEnd = DateUtils.toDate("2026-08-12")!;
      const rows = rowsFromFlags([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
      ]);

      const pace = computeSchedulePace(rows, todayAfterEnd);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("behind");
      expect(pace!.overdueDays).toBe(3);
      expect(pace!.aheadDays).toBe(0);
      expectCalendarDay(pace!.predictedEndDate, "2026-08-13");
    });

    it("marca ahead quando hoje é anterior ao início e já há lidos", () => {
      const todayBeforeStart = DateUtils.toDate("2026-07-31")!;
      const rows = rowsFromFlags([
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ]);

      const pace = computeSchedulePace(rows, todayBeforeStart);

      expect(pace).not.toBeNull();
      expect(pace!.status).toBe("ahead");
      expect(pace!.overdueDays).toBe(0);
      expect(pace!.aheadDays).toBe(1);
      expectCalendarDay(pace!.predictedEndDate, "2026-08-09");
    });
  });
});

describe("computeSchedulePaceFromAggregates", () => {
  it("retorna null para entrada nula ou indefinida", () => {
    expect(computeSchedulePaceFromAggregates(null)).toBeNull();
    expect(computeSchedulePaceFromAggregates(undefined)).toBeNull();
  });

  it("retorna null quando overdue, ahead ou lastDate estão ausentes", () => {
    expect(computeSchedulePaceFromAggregates({})).toBeNull();
    expect(
      computeSchedulePaceFromAggregates({ overdue: 0, ahead: 0 }),
    ).toBeNull();
    expect(
      computeSchedulePaceFromAggregates({ lastDate: LAST_DATE, overdue: 0 }),
    ).toBeNull();
    expect(
      computeSchedulePaceFromAggregates({ lastDate: LAST_DATE, ahead: 0 }),
    ).toBeNull();
  });

  it("retorna null quando lastDate é inválido", () => {
    expect(
      computeSchedulePaceFromAggregates({
        overdue: 0,
        ahead: 0,
        lastDate: "não é data",
      }),
    ).toBeNull();
  });

  it("aplica a mesma fórmula em dia com overdue 0 e ahead 0", () => {
    const pace = computeSchedulePaceFromAggregates({
      overdue: 0,
      ahead: 0,
      lastDate: LAST_DATE,
    });

    expect(pace).not.toBeNull();
    expect(pace!.status).toBe("on_time");
    expect(pace!.overdueDays).toBe(0);
    expect(pace!.aheadDays).toBe(0);
    expectCalendarDay(pace!.plannedEndDate, LAST_DATE);
    expectCalendarDay(pace!.predictedEndDate, LAST_DATE);
  });

  it("marca behind e posterga a data prevista pelos dias de atraso", () => {
    const pace = computeSchedulePaceFromAggregates({
      overdue: 2,
      ahead: 0,
      lastDate: LAST_DATE,
    });

    expect(pace).not.toBeNull();
    expect(pace!.status).toBe("behind");
    expect(pace!.overdueDays).toBe(2);
    expectCalendarDay(pace!.predictedEndDate, "2026-08-12");
  });

  it("marca ahead e antecipa a data prevista pelos dias adiantados", () => {
    const pace = computeSchedulePaceFromAggregates({
      overdue: 0,
      ahead: 1,
      lastDate: LAST_DATE,
    });

    expect(pace).not.toBeNull();
    expect(pace!.status).toBe("ahead");
    expect(pace!.aheadDays).toBe(1);
    expectCalendarDay(pace!.predictedEndDate, "2026-08-09");
  });

  it("permanece behind no misto e anula os deslocamentos na data prevista", () => {
    const pace = computeSchedulePaceFromAggregates({
      overdue: 1,
      ahead: 1,
      lastDate: LAST_DATE,
    });

    expect(pace).not.toBeNull();
    expect(pace!.status).toBe("behind");
    expectCalendarDay(pace!.predictedEndDate, LAST_DATE);
  });

  it("aceita lastDate em Date ou em pt-BR", () => {
    const fromDate = computeSchedulePaceFromAggregates({
      overdue: 0,
      ahead: 0,
      lastDate: DateUtils.toDate(LAST_DATE)!,
    });
    const fromPtBr = computeSchedulePaceFromAggregates({
      overdue: 0,
      ahead: 0,
      lastDate: "10/08/2026",
    });

    expect(fromDate).not.toBeNull();
    expect(fromPtBr).not.toBeNull();
    expectCalendarDay(fromDate!.predictedEndDate, LAST_DATE);
    expectCalendarDay(fromPtBr!.predictedEndDate, LAST_DATE);
  });
});
