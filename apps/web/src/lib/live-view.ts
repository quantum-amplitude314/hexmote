import type { LiveMessage, Painter, PublicCanvasView } from "@hexmote/contracts";
import { type Cell, cellKey } from "@hexmote/domain";

export type RecentPaint = { id: number; cell: Cell; painter: Painter };

export type LiveState = {
  view: PublicCanvasView | null;
  you: Painter | null;
  online: Painter[];
  recentPaints: RecentPaint[];
};

export const emptyLiveState: LiveState = { view: null, you: null, online: [], recentPaints: [] };

type ApplyLiveMessage = (input: { state: LiveState; message: LiveMessage }) => LiveState;

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

export const applyLiveMessage: ApplyLiveMessage = ({ state, message }) => {
  switch (message.type) {
    case "snapshot":
      return { ...state, view: message.view };
    case "welcome":
      return { ...state, you: message.you };
    case "presence":
      return { ...state, online: message.online };
    case "cellPainted":
      return paintedState({ state, message });
    case "status": {
      const { status, resetAt } = message;

      return state.view ? { ...state, view: { ...state.view, status, resetAt } } : state;
    }
    default:
      return message satisfies never;
  }
};
