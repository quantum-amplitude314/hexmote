import type { CanvasEvent, CanvasView, Cell, HexCodeColor } from "@hexmote/domain";

export type PublicCanvasView = Omit<CanvasView, "freezes">;

export type LiveMessage =
  | { type: "snapshot"; view: PublicCanvasView }
  | { type: "cellPainted"; cell: Cell; color: HexCodeColor; completionPercent: number }
  | { type: "status"; status: CanvasView["status"] };

type LiveMessageFor = (input: { event: CanvasEvent; view: CanvasView }) => LiveMessage;

// An allowlist: a new `CanvasView` field stays private until it is added here.
export const toPublicView = ({ cells, completionPercent, status }: CanvasView) => {
  const publicView: PublicCanvasView = { cells, completionPercent, status };

  return publicView;
};

export const snapshotOf = (view: CanvasView) => {
  const snapshot: LiveMessage = { type: "snapshot", view: toPublicView(view) };

  return snapshot;
};

export const liveMessageFor: LiveMessageFor = ({ event, view }) => {
  switch (event.type) {
    case "CanvasCreated":
      return snapshotOf(view);
    case "CellPainted":
      return {
        type: "cellPainted",
        cell: event.cell,
        color: event.color,
        completionPercent: view.completionPercent,
      };
    case "CanvasFrozen":
    case "CanvasUnfrozen":
      return { type: "status", status: view.status };
    default:
      return event satisfies never;
  }
};
