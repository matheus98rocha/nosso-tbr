export const RECAP_GRID_COLUMNS = 3;
export const RECAP_GRID_ROWS = 4;
export const RECAP_COVERS_PER_IMAGE = RECAP_GRID_COLUMNS * RECAP_GRID_ROWS;
export const RECAP_COVER_WIDTH = 90;
export const RECAP_COVER_HEIGHT = 130;

export function measureRecapCoverGrid({
  areaWidth,
  areaHeight,
  gap,
}: {
  areaWidth: number;
  areaHeight: number;
  gap: number;
}) {
  const maxCellWidth =
    (areaWidth - gap * (RECAP_GRID_COLUMNS - 1)) / RECAP_GRID_COLUMNS;
  const maxCellHeight =
    (areaHeight - gap * (RECAP_GRID_ROWS - 1)) / RECAP_GRID_ROWS;
  const heightFromWidth =
    maxCellWidth * (RECAP_COVER_HEIGHT / RECAP_COVER_WIDTH);
  const widthFromHeight =
    maxCellHeight * (RECAP_COVER_WIDTH / RECAP_COVER_HEIGHT);
  const fitsByWidth = heightFromWidth <= maxCellHeight;
  const cellWidth = fitsByWidth ? maxCellWidth : widthFromHeight;
  const cellHeight = fitsByWidth ? heightFromWidth : maxCellHeight;
  const usedWidth =
    cellWidth * RECAP_GRID_COLUMNS + gap * (RECAP_GRID_COLUMNS - 1);
  const usedHeight =
    cellHeight * RECAP_GRID_ROWS + gap * (RECAP_GRID_ROWS - 1);

  return {
    cellWidth,
    cellHeight,
    offsetX: (areaWidth - usedWidth) / 2,
    offsetY: (areaHeight - usedHeight) / 2,
  };
}
