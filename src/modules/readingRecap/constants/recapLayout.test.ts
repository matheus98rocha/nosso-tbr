import { describe, expect, it } from "vitest";

import {
  RECAP_COVER_HEIGHT,
  RECAP_COVER_WIDTH,
  RECAP_COVERS_PER_IMAGE,
  RECAP_GRID_COLUMNS,
  RECAP_GRID_ROWS,
  measureRecapCoverGrid,
} from "./recapLayout";

describe("recapLayout", () => {
  it("fixa a grade 3×4 com 12 capas por imagem", () => {
    expect(RECAP_GRID_COLUMNS).toBe(3);
    expect(RECAP_GRID_ROWS).toBe(4);
    expect(RECAP_COVERS_PER_IMAGE).toBe(12);
  });

  it("usa a proporção do BookCard padrão 90×130", () => {
    expect(RECAP_COVER_WIDTH).toBe(90);
    expect(RECAP_COVER_HEIGHT).toBe(130);
  });

  it("mede células 90/130 centralizadas em área 936×1400 com gap 22", () => {
    const areaWidth = 936;
    const areaHeight = 1400;
    const gap = 22;
    const grid = measureRecapCoverGrid({ areaWidth, areaHeight, gap });

    expect(grid.cellWidth).toBeCloseTo(230.8846153846154, 8);
    expect(grid.cellHeight).toBeCloseTo(333.5, 8);
    expect(grid.offsetX).toBeCloseTo(99.67307692307692, 8);
    expect(grid.offsetY).toBe(0);

    expect(grid.cellWidth / grid.cellHeight).toBeCloseTo(90 / 130, 8);

    const usedWidth = 3 * grid.cellWidth + 2 * gap;
    const usedHeight = 4 * grid.cellHeight + 3 * gap;
    expect(usedWidth).toBeLessThanOrEqual(areaWidth);
    expect(usedHeight).toBeLessThanOrEqual(areaHeight);
    expect(usedWidth).toBeCloseTo(736.6538461538462, 8);
    expect(usedHeight).toBeCloseTo(1400, 8);
    expect(grid.offsetX * 2 + usedWidth).toBeCloseTo(areaWidth, 8);
    expect(grid.offsetY * 2 + usedHeight).toBeCloseTo(areaHeight, 8);
  });
});
