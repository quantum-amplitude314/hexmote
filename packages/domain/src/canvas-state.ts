import type { Color } from "./cell.ts";
import type { CanvasEvent } from "./events.ts";
import { notImplemented } from "./not-implemented.ts";

/** What `decide` needs to enforce the rules; not a read model. */
export type CanvasState =
  | { status: "none" }
  | {
      status: "open" | "frozen";
      palette: ReadonlySet<Color>;
      templateCells: ReadonlySet<string>;
      lastPaintAtBySession: ReadonlyMap<string, number>;
    };

export const initialState: CanvasState = { status: "none" };

type Evolve = (input: { state: CanvasState; event: CanvasEvent }) => CanvasState;

export const evolve: Evolve = () => notImplemented();

type Replay = (events: CanvasEvent[]) => CanvasState;

export const replay: Replay = () => notImplemented();
