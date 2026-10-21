import type { CanvasState } from "../../canvas/canvas-state.ts";
import { cellKey } from "../../canvas/cell.ts";
import type { PaintCell } from "../../canvas/commands.ts";
import type { CanvasConfig } from "../../canvas/config.ts";
import { accepted, rejected } from "../../canvas/decision.ts";
import type { CanvasCompleted, CellPainted } from "../../canvas/events.ts";

export const decidePaintCell = ({
  state,
  command,
  config,
}: {
  state: CanvasState;
  command: PaintCell;
  config: CanvasConfig;
}) => {
  if (state.status === "none") return rejected({ reason: "noCanvas" });

  const { freezes, completed, templateCells, blankCells, palette, lastPaintAtBySession } = state;
  if (freezes.size > 0) return rejected({ reason: "canvasFrozen" });
  if (completed) return rejected({ reason: "canvasCompleted" });

  const { sessionId, cell, color, at } = command;
  if (!templateCells.has(cellKey(cell))) return rejected({ reason: "cellOutsideCanvas" });
  if (!palette.has(color)) return rejected({ reason: "colorNotInPalette" });

  const lastPaintAt = lastPaintAtBySession.get(sessionId) ?? Number.NEGATIVE_INFINITY;
  const { cooldownMs, resetAfterMs } = config;
  const nextPaintAt = lastPaintAt + cooldownMs;
  if (at < nextPaintAt) return rejected({ reason: "cooldown", retryAt: nextPaintAt });

  const painted: CellPainted = { type: "CellPainted", sessionId, cell, color, at };
  const fillsLastBlankCell = blankCells.size === 1 && blankCells.has(cellKey(cell));
  const completedCanvas: CanvasCompleted = {
    type: "CanvasCompleted",
    at,
    resetAt: at + resetAfterMs,
  };
  const decision = accepted(fillsLastBlankCell ? [painted, completedCanvas] : [painted]);

  return decision;
};
