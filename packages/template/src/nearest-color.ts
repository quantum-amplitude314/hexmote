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

type Oklab = [lightness: number, greenRed: number, blueYellow: number];

const linearOf = (channel: number) => {
  const value = channel / 255;
  const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

  return linear;
};

// https://bottosson.github.io/posts/oklab/
const oklabOf = ({ red, green, blue }: Rgb) => {
  const [r, g, b] = [red, green, blue].map(linearOf) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const oklab: Oklab = [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];

  return oklab;
};

const squaredDistance = ({ from, to }: { from: Oklab; to: Oklab }) =>
  from.reduce((sum, value, index) => sum + (value - (to[index] ?? 0)) ** 2, 0);

export const nearestColor: NearestColor = ({ rgb, palette }) => {
  const target = oklabOf(rgb);
  const [nearest] = palette
    .map((color) => ({
      color,
      distance: squaredDistance({ from: target, to: oklabOf(rgbOf(color)) }),
    }))
    .sort((left, right) => left.distance - right.distance);
  if (!nearest) throw new Error("Palette is empty");

  return nearest.color;
};
