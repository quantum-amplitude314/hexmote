import type { Cell, HexCodeColor, TemplateCell } from "./cell.ts";
import type { FreezeReason } from "./events.ts";

export type CreateCanvas = {
  type: "CreateCanvas";
  palette: HexCodeColor[];
  template: TemplateCell[];
  at: number;
};

/** `sessionId` and `at` are set by the server, never by the client. */
export type PaintCell = {
  type: "PaintCell";
  sessionId: string;
  cell: Cell;
  color: HexCodeColor;
  at: number;
};

export type FreezeCanvas = { type: "FreezeCanvas"; reason: FreezeReason; at: number };

export type UnfreezeCanvas = { type: "UnfreezeCanvas"; reason: FreezeReason; at: number };

export type CanvasCommand = CreateCanvas | PaintCell | FreezeCanvas | UnfreezeCanvas;
