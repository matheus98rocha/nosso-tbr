import { describe, expect, it } from "vitest";

import { DateUtils } from "@/utils";

import { formatSchedulePaceLabels } from "./formatSchedulePaceLabels";

const PLANNED_END = DateUtils.toDate("2026-08-10")!;

function pace(input: {
  status: "on_time" | "ahead" | "behind";
  overdueDays?: number;
  aheadDays?: number;
  predictedEndDate: Date;
  plannedEndDate?: Date;
}) {
  return {
    status: input.status,
    overdueDays: input.overdueDays ?? 0,
    aheadDays: input.aheadDays ?? 0,
    plannedEndDate: input.plannedEndDate ?? PLANNED_END,
    predictedEndDate: input.predictedEndDate,
  };
}

function expectNoForbiddenAheadCopy(text: string) {
  const normalized = text.toLowerCase();

  expect(normalized.includes("termina") && normalized.includes("dias antes")).toBe(
    false,
  );
  expect(normalized).not.toContain("termina 1 dias antes");
  expect(normalized).not.toContain("termina 1 dia antes");
}

describe("formatSchedulePaceLabels", () => {
  it("sempre formata a data prevista de término em pt-BR", () => {
    const predictedEndDate = DateUtils.toDate("2026-08-10")!;
    const labels = formatSchedulePaceLabels(
      pace({ status: "on_time", predictedEndDate }),
    );

    expect(labels.caption).toBe("Data prevista de término");
    expect(labels.dateText).toBe("10/08/2026");
    expect(labels.statusLabel).toBe("Em dia");
    expect(labels.predictedEnd).toBe(
      `Data prevista de término: ${DateUtils.formatForDisplay(predictedEndDate)}`,
    );
    expect(labels.predictedEnd).toBe("Data prevista de término: 10/08/2026");
    expect(labels.ariaLabel).toContain("Em dia");
  });

  it("não exibe atraso quando o ritmo está em dia", () => {
    const labels = formatSchedulePaceLabels(
      pace({
        status: "on_time",
        overdueDays: 0,
        aheadDays: 0,
        predictedEndDate: DateUtils.toDate("2026-08-10")!,
      }),
    );

    expect(labels.delay).toBeNull();
    expect(labels.ariaLabel).toContain("10/08/2026");
    expect(labels.ariaLabel.toLowerCase()).not.toContain("atraso");
  });

  it("não exibe atraso quando está adiantado e nunca usa termina X dias antes", () => {
    const predictedEndDate = DateUtils.toDate("2026-08-09")!;
    const labels = formatSchedulePaceLabels(
      pace({
        status: "ahead",
        overdueDays: 0,
        aheadDays: 1,
        predictedEndDate,
      }),
    );

    expect(labels.delay).toBeNull();
    expect(labels.statusLabel).toBe("Adiantado");
    expect(labels.dateText).toBe("09/08/2026");
    expect(labels.predictedEnd).toBe(
      `Data prevista de término: ${DateUtils.formatForDisplay(predictedEndDate)}`,
    );
    expectNoForbiddenAheadCopy(
      `${labels.predictedEnd} ${labels.delay ?? ""} ${labels.ariaLabel}`,
    );
  });

  it("exibe atraso no singular quando há 1 dia vencido", () => {
    const predictedEndDate = DateUtils.toDate("2026-08-11")!;
    const labels = formatSchedulePaceLabels(
      pace({
        status: "behind",
        overdueDays: 1,
        predictedEndDate,
      }),
    );

    expect(labels.statusLabel).toBe("Atrasado");
    expect(labels.delay).toBe("Atraso de 1 dia");
    expect(labels.ariaLabel).toContain("11/08/2026");
    expect(labels.ariaLabel).toContain("Atraso de 1 dia");
  });

  it("exibe atraso no plural quando há 2 dias vencidos", () => {
    const predictedEndDate = DateUtils.toDate("2026-08-12")!;
    const labels = formatSchedulePaceLabels(
      pace({
        status: "behind",
        overdueDays: 2,
        predictedEndDate,
      }),
    );

    expect(labels.delay).toBe("Atraso de 2 dias");
    expect(labels.predictedEnd).toBe("Data prevista de término: 12/08/2026");
    expect(labels.ariaLabel).toContain("12/08/2026");
    expect(labels.ariaLabel).toContain("Atraso de 2 dias");
  });
});
