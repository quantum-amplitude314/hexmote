import { cellKey, type HexCodeColor } from "./cell.ts";
import type {
  CanvasCreated,
  CanvasEvent,
  CanvasFrozen,
  CanvasUnfrozen,
  CellPainted,
  FreezeReason,
} from "./events.ts";

/** What `decide` needs to enforce the rules; the read model is `CanvasView`. */
export type CanvasState =
  | { status: "none" }
  | {
      status: "created";
      freezes: ReadonlySet<FreezeReason>;
      palette: ReadonlySet<HexCodeColor>;
      templateCells: ReadonlySet<string>;
      lastPaintAtBySession: ReadonlyMap<string, number>;
    };

type CreatedCanvasState = Exclude<CanvasState, { status: "none" }>;

export const initialState: CanvasState = { status: "none" };

/** Events were validated by `decide` when recorded, so a stream without `CanvasCreated` is corrupt. */
const createdCanvas = ({ state, event }: { state: CanvasState; event: CanvasEvent }) => {
  if (state.status === "none") throw new Error(`${event.type} before CanvasCreated`);

  return state;
};

const createdState = ({ palette, template }: CanvasCreated) => {
  const state: CanvasState = {
    status: "created",
    freezes: new Set(),
    palette: new Set(palette),
    templateCells: new Set(template.map(({ cell }) => cellKey(cell))),
    lastPaintAtBySession: new Map(),
  };

  return state;
};

const paintedState = ({ state, event }: { state: CreatedCanvasState; event: CellPainted }) => {
  const { sessionId, at } = event;
  const lastPaintAtBySession = new Map(state.lastPaintAtBySession).set(sessionId, at);
  const painted: CanvasState = { ...state, lastPaintAtBySession };

  return painted;
};

const frozenState = ({ state, event }: { state: CreatedCanvasState; event: CanvasFrozen }) => {
  const freezes = new Set(state.freezes).add(event.reason);
  const frozen: CanvasState = { ...state, freezes };

  return frozen;
};

const unfrozenState = ({ state, event }: { state: CreatedCanvasState; event: CanvasUnfrozen }) => {
  const { reason } = event;
  const freezes = new Set([...state.freezes].filter((active) => active !== reason));
  const unfrozen: CanvasState = { ...state, freezes };

  return unfrozen;
};

export const evolve = ({ state, event }: { state: CanvasState; event: CanvasEvent }) => {
  switch (event.type) {
    case "CanvasCreated":
      return createdState(event);
    case "CellPainted":
      return paintedState({ state: createdCanvas({ state, event }), event });
    case "CanvasFrozen":
      return frozenState({ state: createdCanvas({ state, event }), event });
    case "CanvasUnfrozen":
      return unfrozenState({ state: createdCanvas({ state, event }), event });
    default:
      return event satisfies never;
  }
};

export const replay = (events: CanvasEvent[]) => {
  const state = events.reduce<CanvasState>(
    (current, event) => evolve({ state: current, event }),
    initialState,
  );

  return state;
};
