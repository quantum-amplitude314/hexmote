import type { LiveMessage, Painter, PublicCanvasView } from "@hexmote/contracts";
import { type Cell, cellKey } from "@hexmote/domain";

export type RecentPaint = { id: number; cell: Cell; painter: Painter };

export type LiveState = {
  view: PublicCanvasView | null;
  you: Painter | null;
  online: Painter[];
  recentPaints: RecentPaint[];
  connected: boolean;
};

export const emptyLiveState: LiveState = {
  view: null,
  you: null,
  online: [],
  recentPaints: [],
  connected: false,
};

/** A message from the server, or the client noticing the connection dropped. */
export type LiveUpdate = LiveMessage | { type: "disconnected" };

type ApplyLiveUpdate = (input: { state: LiveState; update: LiveUpdate }) => LiveState;

type CellPaintedMessage = Extract<LiveMessage, { type: "cellPainted" }>;

const maxRecentPaints = 8;

const paintedView = ({
  view,
  message,
}: {
  view: PublicCanvasView;
  message: CellPaintedMessage;
}) => {
  const { cell, color, paintedPercent } = message;
  const paintedKey = cellKey(cell);
  const painted: PublicCanvasView = {
    ...view,
    cells: view.cells.map((viewCell) =>
      cellKey(viewCell.cell) === paintedKey ? { ...viewCell, color } : viewCell,
    ),
    paintedPercent,
  };

  return painted;
};

/** Only other people's paints pulse; ids keep each pulse its own animation. */
const withRecentPaint = ({ state, message }: { state: LiveState; message: CellPaintedMessage }) => {
  const { cell, painter } = message;
  const { you, recentPaints } = state;
  if (painter.name === you?.name) return recentPaints;
  const lastId = recentPaints.at(-1)?.id ?? 0;
  const recent = [...recentPaints, { id: lastId + 1, cell, painter }].slice(-maxRecentPaints);

  return recent;
};

const paintedState = ({ state, message }: { state: LiveState; message: CellPaintedMessage }) => {
  const { view } = state;
  if (!view) return state;
  const painted: LiveState = {
    ...state,
    view: paintedView({ view, message }),
    recentPaints: withRecentPaint({ state, message }),
  };

  return painted;
};

export const applyLiveUpdate: ApplyLiveUpdate = ({ state, update }) => {
  switch (update.type) {
    case "snapshot":
      return { ...state, view: update.view, connected: true };
    case "welcome":
      return { ...state, you: update.you };
    case "presence":
      return { ...state, online: update.online };
    case "cellPainted":
      return paintedState({ state, message: update });
    case "status": {
      const { status, resetAt } = update;

      return state.view ? { ...state, view: { ...state.view, status, resetAt } } : state;
    }
    case "disconnected":
      return { ...state, online: [], connected: false };
    default:
      return update satisfies never;
  }
};
