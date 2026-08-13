import { describe, expect, it } from "vitest";
import { normalizeDatesForTransition } from "./bookStatusTransition";

describe("normalizeDatesForTransition", () => {
  it("keeps existing dates when pausing", () => {
    const result = normalizeDatesForTransition({
      currentStatus: "reading",
      currentStartDate: "2025-01-10",
      currentEndDate: null,
      nextStatus: "paused",
      nextStartDate: null,
      nextEndDate: null,
    });

    expect(result).toEqual({
      start_date: "2025-01-10",
      end_date: null,
    });
  });

  it("clears dates when abandoning", () => {
    const result = normalizeDatesForTransition({
      currentStatus: "reading",
      currentStartDate: "2025-01-10",
      currentEndDate: null,
      nextStatus: "abandoned",
      nextStartDate: "2025-02-01",
      nextEndDate: "2025-02-03",
    });

    expect(result).toEqual({
      start_date: null,
      end_date: null,
    });
  });

  it("keeps previous start date when resuming from paused to reading", () => {
    const result = normalizeDatesForTransition({
      currentStatus: "paused",
      currentStartDate: "2025-01-10",
      currentEndDate: null,
      nextStatus: "reading",
      nextStartDate: null,
      nextEndDate: null,
    });

    expect(result).toEqual({
      start_date: "2025-01-10",
      end_date: null,
    });
  });

  it("uses provided start date when resuming from abandoned to reading", () => {
    const result = normalizeDatesForTransition({
      currentStatus: "abandoned",
      currentStartDate: null,
      currentEndDate: null,
      nextStatus: "reading",
      nextStartDate: "2026-01-01",
      nextEndDate: null,
    });

    expect(result).toEqual({
      start_date: "2026-01-01",
      end_date: null,
    });
  });

  it("defaults end_date when marking as finished without a date", () => {
    const result = normalizeDatesForTransition({
      currentStatus: "reading",
      currentStartDate: "2025-01-10",
      currentEndDate: null,
      nextStatus: "finished",
      nextStartDate: null,
      nextEndDate: null,
      referenceDateIso: "2026-08-13",
    });

    expect(result).toEqual({
      start_date: "2025-01-10",
      end_date: "2026-08-13",
    });
  });

  it("keeps provided end_date when finishing", () => {
    const result = normalizeDatesForTransition({
      nextStatus: "finished",
      nextStartDate: "2025-01-10",
      nextEndDate: "2025-06-01",
      referenceDateIso: "2026-08-13",
    });

    expect(result).toEqual({
      start_date: "2025-01-10",
      end_date: "2025-06-01",
    });
  });

  it("falls back to today when finished end_date inputs are invalid", () => {
    const result = normalizeDatesForTransition({
      nextStatus: "finished",
      nextEndDate: "invalid-date",
      referenceDateIso: "",
    });

    expect(result.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
