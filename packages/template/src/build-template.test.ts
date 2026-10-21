import { describe, expect, test } from "bun:test";
import { buildTemplate, type Pixels } from "./build-template.ts";

const palette = ["#000000", "#e50000"];
const red = { red: 255, green: 16, blue: 16 };

const image = ({
  width,
  height,
  isOpaque = () => true,
}: {
  width: number;
  height: number;
  isOpaque?: (point: { x: number; y: number }) => boolean;
}) => {
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      rgba.set([red.red, red.green, red.blue, isOpaque({ x, y }) ? 255 : 0], offset);
    }
  }
  const pixels: Pixels = { width, height, rgba };

  return pixels;
};

// 40 × 20 px with 4 cells across: hexes 10 px wide, two rows (4 cells, then 3 shifted by half).
describe("buildTemplate", () => {
  test("lays out cellsAcross cells in the first row and a shifted row below", () => {
    const template = buildTemplate({
      pixels: image({ width: 40, height: 20 }),
      cellsAcross: 4,
      palette,
    });

    expect(template.map(({ cell }) => cell)).toEqual([
      { axialQ: 0, axialR: 0 },
      { axialQ: 1, axialR: 0 },
      { axialQ: 2, axialR: 0 },
      { axialQ: 3, axialR: 0 },
      { axialQ: 0, axialR: 1 },
      { axialQ: 1, axialR: 1 },
      { axialQ: 2, axialR: 1 },
    ]);
  });

  test("leaves out cells whose centre is transparent", () => {
    const pixels = image({ width: 40, height: 20, isOpaque: ({ x }) => x < 20 });

    const template = buildTemplate({ pixels, cellsAcross: 4, palette });

    expect(template.map(({ cell }) => cell)).toEqual([
      { axialQ: 0, axialR: 0 },
      { axialQ: 1, axialR: 0 },
      { axialQ: 0, axialR: 1 },
    ]);
  });

  test("colours each cell with the nearest palette colour", () => {
    const template = buildTemplate({
      pixels: image({ width: 40, height: 20 }),
      cellsAcross: 4,
      palette,
    });

    expect(new Set(template.map(({ color }) => color))).toEqual(new Set(["#e50000"]));
  });
});
