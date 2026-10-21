import type { Cell, Color, TemplateCell } from "./cell.ts";
import type { FreezeReason } from "./events.ts";

export type CreateCanvas = {
  type: "CreateCanvas";
  palette: Color[];
  template: TemplateCell[];
  at: number;
};

/** `sessionId` and `at` are set by the server, never by the client. */
export type PaintCell = {
  type: "PaintCell";
  sessionId: string;
  cell: Cell;
  color: Color;
  at: number;
};

export type FreezeCanvas = { type: "FreezeCanvas"; reason: FreezeReason; at: number };

export type UnfreezeCanvas = { type: "UnfreezeCanvas"; at: number };

export type CanvasCommand = CreateCanvas | PaintCell | FreezeCanvas | UnfreezeCanvas;
