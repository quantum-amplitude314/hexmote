import type { LiveMessage, PublicCanvasView } from "@hexmote/contracts";
import type { CanvasEvent, CanvasView } from "@hexmote/domain";
import { painterOf } from "./painter.ts";

type LiveMessageFor = (input: { event: CanvasEvent; view: CanvasView }) => LiveMessage;

// An allowlist: a new `CanvasView` field stays private until it is added here.
export const toPublicView = ({ palette, cells, completionPercent, status }: CanvasView) => {
  const publicView: PublicCanvasView = { palette, cells, completionPercent, status };

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
        painter: painterOf(event.sessionId),
      };
    case "CanvasFrozen":
    case "CanvasUnfrozen":
      return { type: "status", status: view.status };
    default:
      return event satisfies never;
  }
};
