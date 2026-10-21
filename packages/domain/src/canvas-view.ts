import type { Cell, HexCodeColor } from "./cell.ts";
import type { CanvasEvent } from "./events.ts";
import { notImplemented } from "./not-implemented.ts";

/** Read model for the canvas page. */
export type CanvasView = {
  cells: { cell: Cell; color: HexCodeColor | null }[];
  completionPercent: number;
  status: "open" | "frozen";
};

export const emptyCanvasView: CanvasView = { cells: [], completionPercent: 0, status: "open" };

type EvolveCanvasView = (input: { view: CanvasView; event: CanvasEvent }) => CanvasView;

export const evolveCanvasView: EvolveCanvasView = () => notImplemented();

type ReplayCanvasView = (events: CanvasEvent[]) => CanvasView;

export const replayCanvasView: ReplayCanvasView = () => notImplemented();
