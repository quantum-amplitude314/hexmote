import type { HexCodeColor } from "@hexmote/domain";
import { notImplemented } from "./not-implemented.ts";

export type Rgb = { red: number; green: number; blue: number };

type NearestColor = (input: { rgb: Rgb; palette: HexCodeColor[] }) => HexCodeColor;

export const nearestColor: NearestColor = () => notImplemented();
