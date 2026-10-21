import type { HexCodeColor, TemplateCell } from "@hexmote/domain";
import { notImplemented } from "./not-implemented.ts";

/** Row-major RGBA, 4 bytes per pixel. */
export type Pixels = { width: number; height: number; rgba: Uint8Array };

type BuildTemplate = (input: {
  pixels: Pixels;
  cellsAcross: number;
  palette: HexCodeColor[];
}) => TemplateCell[];

export const buildTemplate: BuildTemplate = () => notImplemented();
