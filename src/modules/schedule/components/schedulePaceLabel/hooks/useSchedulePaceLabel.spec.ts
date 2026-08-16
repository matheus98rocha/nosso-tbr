import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SchedulePaceDomain } from "../../../types/schedulePace.types";
import { useSchedulePaceLabel } from "./useSchedulePaceLabel";

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

describe("useSchedulePaceLabel", () => {
  it("não renderiza quando pace é null", () => {
    const { result } = renderHook(() =>
      useSchedulePaceLabel({ pace: null, variant: "page" }),
    );

    expect(result.current.shouldRender).toBe(false);
    expect(result.current.labels).toBeNull();
    expect(result.current.showStatusChip).toBe(false);
  });

  it("na página mostra o chip de status em qualquer ritmo", () => {
    const { result } = renderHook(() =>
      useSchedulePaceLabel({ pace: makePace(), variant: "page" }),
    );

    expect(result.current.shouldRender).toBe(true);
    expect(result.current.isCard).toBe(false);
    expect(result.current.showStatusChip).toBe(true);
    expect(result.current.labels?.statusLabel).toBe("Em dia");
    expect(result.current.dateTime).toBe("2026-08-10");
    expect(result.current.rootClassName).toContain("rounded-2xl");
  });

  it("no card omite o chip quando está em dia e destaca a data", () => {
    const { result } = renderHook(() =>
      useSchedulePaceLabel({ pace: makePace(), variant: "card" }),
    );

    expect(result.current.isCard).toBe(true);
    expect(result.current.showStatusChip).toBe(false);
    expect(result.current.rootClassName).toContain("items-center");
    expect(result.current.dateClassName).toContain("text-emerald");
  });

  it("no card mostra o chip Adiantado para sinalizar o ritmo", () => {
    const { result } = renderHook(() =>
      useSchedulePaceLabel({
        pace: makePace({
          status: "ahead",
          aheadDays: 1,
          predictedEndDate: new Date(2026, 7, 9, 12),
        }),
        variant: "card",
      }),
    );

    expect(result.current.showStatusChip).toBe(true);
    expect(result.current.labels?.statusLabel).toBe("Adiantado");
    expect(result.current.dateClassName).toContain("text-teal");
  });

  it("usa tom âmbar quando está atrasado", () => {
    const { result } = renderHook(() =>
      useSchedulePaceLabel({
        pace: makePace({
          status: "behind",
          overdueDays: 2,
          predictedEndDate: new Date(2026, 7, 12, 12),
        }),
        variant: "page",
      }),
    );

    expect(result.current.showStatusChip).toBe(true);
    expect(result.current.labels?.delay).toBe("Atraso de 2 dias");
    expect(result.current.rootClassName).toContain("amber");
    expect(result.current.dateClassName).toContain("text-amber");
  });
});
