import { afterEach, describe, expect, it, vi } from "vitest";

import { RECAP_COVER_PROBE_TIMEOUT_MS } from "../../constants";
import { probeRecapCoverSrc, probeRecapCoverSrcs } from "./probeRecapCoverSrc";

const GOOD = "https://m.media-amazon.com/images/I/good.jpg";
const DEAD = "https://m.media-amazon.com/images/I/dead.jpg";

function stubImage(succeedFor: string[]) {
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(value: string) {
      queueMicrotask(() => {
        if (succeedFor.includes(value)) {
          this.onload?.();
          return;
        }
        this.onerror?.();
      });
    }
  }

  vi.stubGlobal("Image", MockImage);
}

describe("probeRecapCoverSrc", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("resolve verdadeiro quando a capa carrega", async () => {
    stubImage([GOOD]);
    await expect(probeRecapCoverSrc(GOOD)).resolves.toBe(true);
  });

  it("resolve falso quando a capa falha", async () => {
    stubImage([]);
    await expect(probeRecapCoverSrc(DEAD)).resolves.toBe(false);
  });

  it("trata timeout como falha", async () => {
    class HangImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {}
    }
    vi.stubGlobal("Image", HangImage);
    vi.useFakeTimers();

    try {
      const promise = probeRecapCoverSrc(GOOD);
      await vi.advanceTimersByTimeAsync(RECAP_COVER_PROBE_TIMEOUT_MS);
      await expect(promise).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("probeRecapCoverSrcs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devolve só as capas que falharam", async () => {
    stubImage([GOOD]);
    await expect(probeRecapCoverSrcs([GOOD, DEAD, GOOD])).resolves.toEqual([
      DEAD,
    ]);
  });

  it("devolve lista vazia quando não há capas", async () => {
    await expect(probeRecapCoverSrcs([])).resolves.toEqual([]);
  });
});
