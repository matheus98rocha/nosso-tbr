import { describe, expect, it } from "vitest";

import { FAB_BOTTOM_CLASS } from "./floatingActionButton";

describe("FAB_BOTTOM_CLASS", () => {
  it("ancora os FABs na borda inferior com folga progressiva e safe-area", () => {
    expect(FAB_BOTTOM_CLASS).toContain(
      "bottom-[calc(3rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).toContain(
      "md:bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).toContain(
      "lg:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).toContain(
      "xl:bottom-[calc(6rem+env(safe-area-inset-bottom,0px))]",
    );
  });

  it("nunca posiciona FABs no topo", () => {
    expect(FAB_BOTTOM_CLASS).not.toMatch(/(^|\s)top-/);
  });
});
