import type { CanvasView, Cell, HexCodeColor } from "@hexmote/domain";

export type PublicCanvasView = Omit<CanvasView, "freezes">;

export type LiveMessage =
  | { type: "snapshot"; view: PublicCanvasView }
  | { type: "cellPainted"; cell: Cell; color: HexCodeColor; completionPercent: number }
  | { type: "status"; status: CanvasView["status"] };
