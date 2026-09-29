import { describe, expect, it } from "vitest";

import {
  FAB_BOTTOM_CLASS,
  FAB_CONTENT_PADDING_CLASS,
} from "./floatingActionButton";

describe("FAB_BOTTOM_CLASS", () => {
  it("ancora o dock acima da bottom nav no mobile e perto da base a partir de lg", () => {
    expect(FAB_BOTTOM_CLASS).toContain(
      "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).toContain(
      "lg:bottom-[calc(1.75rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).not.toMatch(/(^|\s)top-/);
  });
});

describe("FAB_CONTENT_PADDING_CLASS", () => {
  it("reserva espaço inferior para o dock e a bottom nav no mobile", () => {
    expect(FAB_CONTENT_PADDING_CLASS).toContain(
      "pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_CONTENT_PADDING_CLASS).toContain(
      "lg:pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))]",
    );
  });
});
