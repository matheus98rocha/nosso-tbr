import { describe, expect, it } from "vitest";

import {
  FAB_BOTTOM_CLASS,
  FAB_CONTENT_PADDING_CLASS,
} from "./floatingActionButton";

describe("FAB_BOTTOM_CLASS", () => {
  it("ancora os FABs na inferior 10% mais baixo que a folga anterior", () => {
    expect(FAB_BOTTOM_CLASS).toContain(
      "bottom-[calc(2.7rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).toContain(
      "md:bottom-[calc(3.15rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).toContain(
      "lg:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).toContain(
      "xl:bottom-[calc(5.4rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_BOTTOM_CLASS).not.toContain(
      "bottom-[calc(3rem+env(safe-area-inset-bottom,0px))]",
    );
  });

  it("nunca posiciona FABs no topo", () => {
    expect(FAB_BOTTOM_CLASS).not.toMatch(/(^|\s)top-/);
  });
});

describe("FAB_CONTENT_PADDING_CLASS", () => {
  it("reserva espaço inferior para o conteúdo não ficar sob os FABs", () => {
    expect(FAB_CONTENT_PADDING_CLASS).toContain(
      "pb-[calc(6.7rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_CONTENT_PADDING_CLASS).toContain(
      "md:pb-[calc(7.15rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_CONTENT_PADDING_CLASS).toContain(
      "lg:pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))]",
    );
    expect(FAB_CONTENT_PADDING_CLASS).toContain(
      "xl:pb-[calc(9.4rem+env(safe-area-inset-bottom,0px))]",
    );
  });
});
