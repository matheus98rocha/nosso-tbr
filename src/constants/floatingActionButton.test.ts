import { describe, expect, it } from "vitest";

import {
  FAB_BOTTOM_CLASS,
  FAB_CONTENT_PADDING_CLASS,
} from "./floatingActionButton";

describe("FAB_BOTTOM_CLASS", () => {
  it("ancora o dock de ações na inferior com safe-area, nunca no topo", () => {
    expect(FAB_BOTTOM_CLASS).toContain(
      "bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).toContain(
      "md:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).toContain(
      "lg:bottom-[calc(1.75rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).not.toMatch(/(^|\s)top-/);
  });
});

describe("FAB_CONTENT_PADDING_CLASS", () => {
  it("reserva espaço inferior para o conteúdo não ficar sob o dock", () => {
    expect(FAB_CONTENT_PADDING_CLASS).toContain(
      "pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_CONTENT_PADDING_CLASS).toContain(
      "md:pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_CONTENT_PADDING_CLASS).toContain(
      "lg:pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))]",
    );
  });
});
