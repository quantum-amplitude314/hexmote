import { cellKey, type HexCodeColor } from "./cell.ts";
import type {
  CanvasCreated,
  CanvasEvent,
  CanvasFrozen,
  CanvasUnfrozen,
  CellPainted,
  FreezeReason,
} from "./events.ts";

export type CanvasState =
  | { status: "none" }
  | {
      status: "created";
      freezes: ReadonlySet<FreezeReason>;
      palette: ReadonlySet<HexCodeColor>;
      templateCells: ReadonlySet<string>;
      blankCells: ReadonlySet<string>;
      lastPaintAtBySession: ReadonlyMap<string, number>;
      completed: boolean;
    };

type CreatedCanvasState = Exclude<CanvasState, { status: "none" }>;

export const initialState: CanvasState = { status: "none" };

/** Events were validated by `decide` when recorded, so a stream without `CanvasCreated` is corrupt. */
const createdCanvas = ({ state, event }: { state: CanvasState; event: CanvasEvent }) => {
  if (state.status === "none") throw new Error(`${event.type} before CanvasCreated`);

  return state;
};

const createdState = ({ palette, template }: CanvasCreated) => {
  const templateCells = new Set(template.map(({ cell }) => cellKey(cell)));
  const state: CanvasState = {
    status: "created",
    freezes: new Set(),
    palette: new Set(palette),
    templateCells,
    blankCells: templateCells,
    lastPaintAtBySession: new Map(),
    completed: false,
  };

  return state;
};

const paintedState = ({ state, event }: { state: CreatedCanvasState; event: CellPainted }) => {
  const { sessionId, cell, at } = event;
  const lastPaintAtBySession = new Map(state.lastPaintAtBySession).set(sessionId, at);
  const paintedKey = cellKey(cell);
  const blankCells = new Set([...state.blankCells].filter((blank) => blank !== paintedKey));
  const painted: CanvasState = { ...state, blankCells, lastPaintAtBySession };

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

const completedState = (state: CreatedCanvasState) => {
  const completed: CanvasState = { ...state, completed: true };

  return completed;
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
    case "CanvasCompleted":
      return completedState(createdCanvas({ state, event }));
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
