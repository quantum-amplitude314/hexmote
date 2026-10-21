import type { HexCodeColor } from "@hexmote/domain";

export type Rgb = { red: number; green: number; blue: number };

type NearestColor = (input: { rgb: Rgb; palette: HexCodeColor[] }) => HexCodeColor;

const rgbOf = (color: HexCodeColor) => {
  const rgb: Rgb = {
    red: Number.parseInt(color.slice(1, 3), 16),
    green: Number.parseInt(color.slice(3, 5), 16),
    blue: Number.parseInt(color.slice(5, 7), 16),
  };

  return rgb;
};

const squaredDistance = ({ from, to }: { from: Rgb; to: Rgb }) =>
  (from.red - to.red) ** 2 + (from.green - to.green) ** 2 + (from.blue - to.blue) ** 2;

export const nearestColor: NearestColor = ({ rgb, palette }) => {
  const [nearest] = palette
    .map((color) => ({ color, distance: squaredDistance({ from: rgb, to: rgbOf(color) }) }))
    .sort((left, right) => left.distance - right.distance);
  if (!nearest) throw new Error("Palette is empty");

  return nearest.color;
};
