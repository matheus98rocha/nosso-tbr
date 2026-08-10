import { describe, expect, it } from "vitest";

import { normalizeStatsReaderOptions } from "./normalizeStatsReaderOptions";

describe("normalizeStatsReaderOptions", () => {
  it("maps user domain rows to id/label pairs", () => {
    expect(
      normalizeStatsReaderOptions([
        { id: "uuid-1", display_name: "Ana" },
        { id: "uuid-2", display_name: "João" },
      ]),
    ).toEqual([
      { id: "uuid-1", label: "Ana" },
      { id: "uuid-2", label: "João" },
    ]);
  });

  it("supports legacy label/value options", () => {
    expect(
      normalizeStatsReaderOptions([
        {
          id: "uuid-1",
          display_name: "Ana",
          label: "Ana Alias",
          value: "uuid-1",
        },
      ]),
    ).toEqual([{ id: "uuid-1", label: "Ana" }]);
  });

  it("filters invalid entries", () => {
    expect(
      normalizeStatsReaderOptions([
        { id: "", display_name: "Sem id" },
        { id: "uuid-1", display_name: "Ana" },
      ]),
    ).toEqual([{ id: "uuid-1", label: "Ana" }]);
  });
});
