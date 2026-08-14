import { describe, expect, it } from "vitest";
import {
  ensureCreatableStatus,
  validateTransition,
} from "./bookUpsert.validation";

describe("bookUpsert.validation", () => {
  it("ensureCreatableStatus rejects paused", () => {
    expect(() => ensureCreatableStatus("paused")).toThrow(/pausado ou abandonado/i);
  });

  it("validateTransition allows paused only from reading", () => {
    expect(() =>
      validateTransition(
        { status: "finished", start_date: null },
        "paused",
        null,
      ),
    ).toThrow(/só podem ser aplicados/i);
  });

  it("validateTransition requires start_date when resuming abandoned to reading", () => {
    expect(() =>
      validateTransition(
        { status: "abandoned", start_date: null },
        "reading",
        null,
      ),
    ).toThrow(/nova data de início/i);
  });
});
