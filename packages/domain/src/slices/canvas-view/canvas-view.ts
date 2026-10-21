import { type Cell, cellKey, type HexCodeColor } from "../../canvas/cell.ts";
import type {
  CanvasCreated,
  CanvasEvent,
  CanvasFrozen,
  CanvasUnfrozen,
  CellPainted,
  FreezeReason,
} from "../../canvas/events.ts";

export type CanvasViewCell = { cell: Cell; targetColor: HexCodeColor; color: HexCodeColor | null };

export type CanvasView = {
  cells: CanvasViewCell[];
  completionPercent: number;
  status: "open" | "frozen";
  freezes: FreezeReason[];
};

export const emptyCanvasView: CanvasView = {
  cells: [],
  completionPercent: 0,
  status: "open",
  freezes: [],
};

const completionPercentOf = (cells: CanvasViewCell[]) => {
  const matching = cells.filter(({ targetColor, color }) => color === targetColor).length;
  const completionPercent = cells.length === 0 ? 0 : Math.floor((matching / cells.length) * 100);

  return completionPercent;
};

const createdView = ({ template }: CanvasCreated) => {
  const view: CanvasView = {
    ...emptyCanvasView,
    cells: template.map(({ cell, color }) => ({ cell, targetColor: color, color: null })),
  };

  return view;
};

const paintedView = ({ view, event }: { view: CanvasView; event: CellPainted }) => {
  const paintedKey = cellKey(event.cell);
  const cells = view.cells.map((viewCell) =>
    cellKey(viewCell.cell) === paintedKey ? { ...viewCell, color: event.color } : viewCell,
  );
  const painted: CanvasView = { ...view, cells, completionPercent: completionPercentOf(cells) };

  return painted;
};

const viewWithFreezes = ({ view, freezes }: { view: CanvasView; freezes: FreezeReason[] }) => {
  const updated: CanvasView = { ...view, freezes, status: freezes.length > 0 ? "frozen" : "open" };

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
