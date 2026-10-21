import type { CanvasEvent, CanvasView, Cell, HexCodeColor } from "@hexmote/domain";
import { notImplemented } from "./not-implemented.ts";

export type PublicCanvasView = Omit<CanvasView, "freezes">;

export type LiveMessage =
  | { type: "snapshot"; view: PublicCanvasView }
  | { type: "cellPainted"; cell: Cell; color: HexCodeColor; completionPercent: number }
  | { type: "status"; status: CanvasView["status"] };

export const toPublicView: (view: CanvasView) => PublicCanvasView = () => notImplemented();

export const liveMessageFor: (input: { event: CanvasEvent; view: CanvasView }) => LiveMessage =
  () => notImplemented();
