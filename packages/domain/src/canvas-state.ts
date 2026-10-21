import { cellKey, type HexCodeColor } from "./cell.ts";
import type { CanvasCreated, CanvasEvent } from "./events.ts";
import { notImplemented } from "./not-implemented.ts";

/** What `decide` needs to enforce the rules; not a read model. */
export type CanvasState =
  | { status: "none" }
  | {
      status: "open" | "frozen";
      palette: ReadonlySet<HexCodeColor>;
      templateCells: ReadonlySet<string>;
      lastPaintAtBySession: ReadonlyMap<string, number>;
    };

export const initialState: CanvasState = { status: "none" };

const createdState = ({ palette, template }: CanvasCreated) => {
  const state: CanvasState = {
    status: "open",
    palette: new Set(palette),
    templateCells: new Set(template.map(({ cell }) => cellKey(cell))),
    lastPaintAtBySession: new Map(),
  };

  return state;
};

export const evolve = ({ event }: { state: CanvasState; event: CanvasEvent }) => {
  switch (event.type) {
    case "CanvasCreated":
      return createdState(event);
    default:
      return notImplemented();
  }
};

export const replay = (events: CanvasEvent[]) => {
  const state = events.reduce<CanvasState>(
    (current, event) => evolve({ state: current, event }),
    initialState,
  );

  return state;
};
