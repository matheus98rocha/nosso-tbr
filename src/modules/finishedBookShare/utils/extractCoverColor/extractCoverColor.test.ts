import { describe, expect, it } from "vitest";

import { relativeLuminance } from "../relativeLuminance";
import { extractCoverColor } from "./extractCoverColor";

function imageData(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number, number],
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [red, green, blue, alpha] = paint(x, y);
      const offset = (y * width + x) * 4;
      data[offset] = red;
      data[offset + 1] = green;
      data[offset + 2] = blue;
      data[offset + 3] = alpha;
    }
  }
  return { data, width, height, colorSpace: "srgb" } as ImageData;
}

function solid(
  red: number,
  green: number,
  blue: number,
  alpha = 255,
): ImageData {
  return imageData(8, 8, () => [red, green, blue, alpha]);
}

function hueOf(red: number, green: number, blue: number): number {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

describe("extractCoverColor", () => {
  it("escolhe o ouro sobre o preto e ignora a média preta", () => {
    const image = imageData(20, 20, (x, y) =>
      x < 4 && y < 4 ? [0xe0, 0xa0, 0x20, 255] : [0, 0, 0, 255],
    );
    const color = extractCoverColor(image);

    expect(color).not.toBeNull();
    const luminance = relativeLuminance(
      (color?.r ?? 0) / 255,
      (color?.g ?? 0) / 255,
      (color?.b ?? 0) / 255,
    );
    expect(luminance).toBeGreaterThan(0.08);
    expect(hueOf(color?.r ?? 0, color?.g ?? 0, color?.b ?? 0)).toBeGreaterThan(30);
    expect(hueOf(color?.r ?? 0, color?.g ?? 0, color?.b ?? 0)).toBeLessThan(50);
  });

  it("não deixa brancos e pretos vencerem um bloco cromático menor", () => {
    const image = imageData(20, 20, (x, y) => {
      if (x < 2 && y < 2) return [0xe0, 0xa0, 0x20, 255];
      return x < 10 ? [255, 255, 255, 255] : [0, 0, 0, 255];
    });
    const color = extractCoverColor(image);

    expect(hueOf(color?.r ?? 0, color?.g ?? 0, color?.b ?? 0)).toBeGreaterThan(30);
    expect(hueOf(color?.r ?? 0, color?.g ?? 0, color?.b ?? 0)).toBeLessThan(50);
  });

  it("mantém o azul longe do fallback e do ouro", () => {
    const color = extractCoverColor(solid(0x1e, 0x4d, 0xb7));

    expect(Math.round(color?.r ?? 0)).toBe(0x1e);
    expect(Math.round(color?.g ?? 0)).toBe(0x4d);
    expect(Math.round(color?.b ?? 0)).toBe(0xb7);
    expect(Math.round(color?.r ?? 0)).not.toBe(0x6b);
    expect(Math.round(color?.g ?? 0)).not.toBe(0xe0);
  });

  it("devolve null para preto, branco ou cinza médio", () => {
    expect(extractCoverColor(solid(0, 0, 0))).toBeNull();
    expect(extractCoverColor(solid(255, 255, 255))).toBeNull();
    expect(extractCoverColor(solid(128, 128, 128))).toBeNull();
  });

  it("ignora pixel cromático com alpha abaixo de 128", () => {
    const image = imageData(4, 4, (x, y) =>
      x === 0 && y === 0 ? [0xe0, 0xa0, 0x20, 127] : [0, 0, 0, 255],
    );
    expect(extractCoverColor(image)).toBeNull();
  });

  it("desempata contagem igual pela maior crominância e depois pelo menor índice", () => {
    const chromaTie = imageData(2, 1, (x) =>
      x === 0 ? [255, 0, 0, 255] : [180, 140, 40, 255],
    );
    const chromaWinner = extractCoverColor(chromaTie);
    expect(Math.round(chromaWinner?.r ?? 0)).toBe(255);
    expect(Math.round(chromaWinner?.g ?? 0)).toBe(0);

    const indexTie = imageData(2, 1, (x) =>
      x === 0 ? [255, 0, 0, 255] : [0, 255, 0, 255],
    );
    const indexWinner = extractCoverColor(indexTie);
    expect(Math.round(indexWinner?.g ?? 0)).toBe(255);
    expect(Math.round(indexWinner?.r ?? 0)).toBe(0);
  });
});
