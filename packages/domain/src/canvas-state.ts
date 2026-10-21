import { cellKey, type HexCodeColor } from "./cell.ts";
import type { CanvasCreated, CanvasEvent, CellPainted } from "./events.ts";
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

type ExistingCanvasState = Exclude<CanvasState, { status: "none" }>;

export const initialState: CanvasState = { status: "none" };

/** Events were validated by `decide` when recorded, so a stream without `CanvasCreated` is corrupt. */
const existingCanvas = ({ state, event }: { state: CanvasState; event: CanvasEvent }) => {
  if (state.status === "none") throw new Error(`${event.type} before CanvasCreated`);

  return state;
};

const createdState = ({ palette, template }: CanvasCreated) => {
  const state: CanvasState = {
    status: "open",
    palette: new Set(palette),
    templateCells: new Set(template.map(({ cell }) => cellKey(cell))),
    lastPaintAtBySession: new Map(),
  };

  return state;
};

const paintedState = ({ state, event }: { state: ExistingCanvasState; event: CellPainted }) => {
  const { sessionId, at } = event;
  const lastPaintAtBySession = new Map(state.lastPaintAtBySession).set(sessionId, at);
  const painted: CanvasState = { ...state, lastPaintAtBySession };

  return painted;
};

const frozenState = (state: ExistingCanvasState) => {
  const frozen: CanvasState = { ...state, status: "frozen" };

  return frozen;
};

export const evolve = ({ state, event }: { state: CanvasState; event: CanvasEvent }) => {
  switch (event.type) {
    case "CanvasCreated":
      return createdState(event);
    case "CellPainted":
      return paintedState({ state: existingCanvas({ state, event }), event });
    case "CanvasFrozen":
      return frozenState(existingCanvas({ state, event }));
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
