import type { LiveMessage, PublicCanvasView } from "@hexmote/contracts";
import { cellKey } from "@hexmote/domain";

type ApplyLiveMessage = (input: {
  view: PublicCanvasView | null;
  message: LiveMessage;
}) => PublicCanvasView | null;

type CellPaintedMessage = Extract<LiveMessage, { type: "cellPainted" }>;

const paintedView = ({
  view,
  message,
}: {
  view: PublicCanvasView;
  message: CellPaintedMessage;
}) => {
  const { cell, color, completionPercent } = message;
  const paintedKey = cellKey(cell);
  const painted: PublicCanvasView = {
    ...view,
    cells: view.cells.map((viewCell) =>
      cellKey(viewCell.cell) === paintedKey ? { ...viewCell, color } : viewCell,
    ),
    completionPercent,
  };

  return painted;
};

export const applyLiveMessage: ApplyLiveMessage = ({ view, message }) => {
  if (message.type === "snapshot") return message.view;
  if (!view) return null;
  switch (message.type) {
    case "cellPainted":
      return paintedView({ view, message });
    case "status":
      return { ...view, status: message.status };
    default:
      return message satisfies never;
  }
};
