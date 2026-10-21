import type { Cell, Color, TemplateCell } from "./cell.ts";

export type CanvasCreated = {
  type: "CanvasCreated";
  palette: Color[];
  template: TemplateCell[];
  at: number;
};

export type CellPainted = {
  type: "CellPainted";
  sessionId: string;
  cell: Cell;
  color: Color;
  at: number;
};

export type FreezeReason = "manual" | "budget";

export type CanvasFrozen = { type: "CanvasFrozen"; reason: FreezeReason; at: number };

export type CanvasUnfrozen = { type: "CanvasUnfrozen"; at: number };

export type CanvasEvent = CanvasCreated | CellPainted | CanvasFrozen | CanvasUnfrozen;
