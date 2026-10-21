import type { HexCodeColor, TemplateCell } from "@hexmote/domain";
import { nearestColor } from "./nearest-color.ts";

/** Row-major RGBA, 4 bytes per pixel. */
export type Pixels = { width: number; height: number; rgba: Uint8Array };

type BuildTemplate = (input: {
  pixels: Pixels;
  cellsAcross: number;
  palette: HexCodeColor[];
}) => TemplateCell[];

const minOpaqueAlpha = 128;

// Pointy-top hexes, odd rows shifted right by half a hex (odd-r), matching axial coordinates.
const hexCentres = ({
  width,
  height,
  cellsAcross,
}: {
  width: number;
  height: number;
  cellsAcross: number;
}) => {
  const hexWidth = width / cellsAcross;
  const radius = hexWidth / Math.sqrt(3);
  const rowHeight = 1.5 * radius;
  const rowCount = Math.max(0, Math.ceil((height - radius) / rowHeight));
  const centres = Array.from({ length: rowCount }, (_, row) => {
    const isShifted = row % 2 === 1;
    const columnCount = isShifted ? cellsAcross - 1 : cellsAcross;
    const rowCentres = Array.from({ length: columnCount }, (_, column) => ({
      x: hexWidth * (column + (isShifted ? 1 : 0.5)),
      y: radius + row * rowHeight,
      cell: { axialQ: column - Math.floor(row / 2), axialR: row },
    }));

    return rowCentres;
  }).flat();

  return centres;
};

const pixelAt = ({ pixels, x, y }: { pixels: Pixels; x: number; y: number }) => {
  const { width, rgba } = pixels;
  const offset = (Math.floor(y) * width + Math.floor(x)) * 4;
  const [red = 0, green = 0, blue = 0, alpha = 0] = rgba.subarray(offset, offset + 4);
  const pixel = { rgb: { red, green, blue }, alpha };

  return pixel;
};

export const buildTemplate: BuildTemplate = ({ pixels, cellsAcross, palette }) => {
  const { width, height } = pixels;
  const template = hexCentres({ width, height, cellsAcross }).flatMap(({ x, y, cell }) => {
    const { rgb, alpha } = pixelAt({ pixels, x, y });

    return alpha < minOpaqueAlpha ? [] : [{ cell, color: nearestColor({ rgb, palette }) }];
  });

  return template;
};
