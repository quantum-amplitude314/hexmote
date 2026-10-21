import { type Cell, cellKey, type HexCodeColor } from "../../canvas/cell.ts";
import type {
  CanvasCompleted,
  CanvasCreated,
  CanvasEvent,
  CanvasFrozen,
  CanvasUnfrozen,
  CellPainted,
  FreezeReason,
} from "../../canvas/events.ts";

export type CanvasViewCell = { cell: Cell; targetColor: HexCodeColor; color: HexCodeColor | null };

export type CanvasView = {
  palette: HexCodeColor[];
  cells: CanvasViewCell[];
  paintedPercent: number;
  status: "open" | "frozen" | "completed";
  freezes: FreezeReason[];
  resetAt: number | null;
};

export const emptyCanvasView: CanvasView = {
  palette: [],
  cells: [],
  paintedPercent: 0,
  status: "open",
  freezes: [],
  resetAt: null,
};

/** Rounded down, so 100 % means every cell is painted. */
const paintedPercentOf = (cells: CanvasViewCell[]) => {
  const painted = cells.filter(({ color }) => color !== null).length;
  const paintedPercent = cells.length === 0 ? 0 : Math.floor((painted / cells.length) * 1000) / 10;

  return paintedPercent;
};

const statusOf = ({ freezes, resetAt }: Pick<CanvasView, "freezes" | "resetAt">) => {
  if (freezes.length > 0) return "frozen";
  const status: CanvasView["status"] = resetAt === null ? "open" : "completed";

  return status;
};

const createdView = ({ palette, template }: CanvasCreated) => {
  const view: CanvasView = {
    ...emptyCanvasView,
    palette,
    cells: template.map(({ cell, color }) => ({ cell, targetColor: color, color: null })),
  };

  return view;
};

const paintedView = ({ view, event }: { view: CanvasView; event: CellPainted }) => {
  const paintedKey = cellKey(event.cell);
  const cells = view.cells.map((viewCell) =>
    cellKey(viewCell.cell) === paintedKey ? { ...viewCell, color: event.color } : viewCell,
  );
  const painted: CanvasView = { ...view, cells, paintedPercent: paintedPercentOf(cells) };

  return painted;
};

const viewWithFreezes = ({ view, freezes }: { view: CanvasView; freezes: FreezeReason[] }) => {
  const updated: CanvasView = {
    ...view,
    freezes,
    status: statusOf({ freezes, resetAt: view.resetAt }),
  };

  return updated;
};

const frozenView = ({ view, event }: { view: CanvasView; event: CanvasFrozen }) => {
  const frozen = viewWithFreezes({ view, freezes: [...view.freezes, event.reason] });

  return frozen;
};

const unfrozenView = ({ view, event }: { view: CanvasView; event: CanvasUnfrozen }) => {
  const { reason } = event;
  const unfrozen = viewWithFreezes({
    view,
    freezes: view.freezes.filter((active) => active !== reason),
  });

  return unfrozen;
};

const completedView = ({ view, event }: { view: CanvasView; event: CanvasCompleted }) => {
  const { resetAt } = event;
  const completed: CanvasView = { ...view, resetAt, status: statusOf({ ...view, resetAt }) };

  return completed;
};

export const evolveCanvasView = ({ view, event }: { view: CanvasView; event: CanvasEvent }) => {
  switch (event.type) {
    case "CanvasCreated":
      return createdView(event);
    case "CellPainted":
      return paintedView({ view, event });
    case "CanvasFrozen":
      return frozenView({ view, event });
    case "CanvasUnfrozen":
      return unfrozenView({ view, event });
    case "CanvasCompleted":
      return completedView({ view, event });
    default:
      return event satisfies never;
  }
};

export const replayCanvasView = (events: CanvasEvent[]) => {
  const view = events.reduce<CanvasView>(
    (current, event) => evolveCanvasView({ view: current, event }),
    emptyCanvasView,
  );

  return view;
};
