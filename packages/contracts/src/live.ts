import type { CanvasView, Cell, HexCodeColor } from "@hexmote/domain";

export type PublicCanvasView = Omit<CanvasView, "freezes">;

export type Painter = { name: string; color: HexCodeColor };

export type LiveMessage =
  | { type: "snapshot"; view: PublicCanvasView }
  | { type: "welcome"; you: Painter }
  | { type: "presence"; online: Painter[] }
  | {
      type: "cellPainted";
      cell: Cell;
      color: HexCodeColor;
      paintedPercent: number;
      painter: Painter;
    }
  | { type: "status"; status: CanvasView["status"]; resetAt: CanvasView["resetAt"] };

/** Plain-text heartbeat frames, outside `LiveMessage`. */
export const livePing = "ping";
export const livePong = "pong";
