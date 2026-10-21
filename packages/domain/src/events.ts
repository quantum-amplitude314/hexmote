import type { Cell, HexCodeColor, TemplateCell } from "./cell.ts";

export type CanvasCreated = {
  type: "CanvasCreated";
  palette: HexCodeColor[];
  template: TemplateCell[];
  at: number;
};

export type CellPainted = {
  type: "CellPainted";
  sessionId: string;
  cell: Cell;
  color: HexCodeColor;
  at: number;
};

export type FreezeReason = "manual" | "budget";

export type CanvasFrozen = { type: "CanvasFrozen"; reason: FreezeReason; at: number };

export type CanvasUnfrozen = { type: "CanvasUnfrozen"; at: number };

export type CanvasEvent = CanvasCreated | CellPainted | CanvasFrozen | CanvasUnfrozen;
