import type { CanvasView, Cell, HexCodeColor } from "@hexmote/domain";

export type PublicCanvasView = Omit<CanvasView, "freezes">;

/** A session's public face: a name like "Blue Fox"; the session id stays on the server. */
export type Painter = { name: string; color: HexCodeColor };

export type LiveMessage =
  | { type: "snapshot"; view: PublicCanvasView }
  | { type: "welcome"; you: Painter }
  | { type: "presence"; online: Painter[] }
  | {
      type: "cellPainted";
      cell: Cell;
      color: HexCodeColor;
      completionPercent: number;
      painter: Painter;
    }
  | { type: "status"; status: CanvasView["status"] };
