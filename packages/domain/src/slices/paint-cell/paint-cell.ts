import type { CanvasState } from "../../canvas/canvas-state.ts";
import { cellKey } from "../../canvas/cell.ts";
import type { PaintCell } from "../../canvas/commands.ts";
import { accepted, rejected } from "../../canvas/decision.ts";
import type { CellPainted } from "../../canvas/events.ts";

export const decidePaintCell = ({
  state,
  command,
  cooldownMs,
}: {
  state: CanvasState;
  command: PaintCell;
  cooldownMs: number;
}) => {
  if (state.status === "none") return rejected({ reason: "noCanvas" });

  const { freezes, templateCells, palette, lastPaintAtBySession } = state;
  if (freezes.size > 0) return rejected({ reason: "canvasFrozen" });

  const { sessionId, cell, color, at } = command;
  if (!templateCells.has(cellKey(cell))) return rejected({ reason: "cellOutsideCanvas" });
  if (!palette.has(color)) return rejected({ reason: "colorNotInPalette" });

  const lastPaintAt = lastPaintAtBySession.get(sessionId) ?? Number.NEGATIVE_INFINITY;
  const nextPaintAt = lastPaintAt + cooldownMs;
  if (at < nextPaintAt) return rejected({ reason: "cooldown", retryAt: nextPaintAt });

  const painted: CellPainted = { type: "CellPainted", sessionId, cell, color, at };
  const decision = accepted([painted]);

  return decision;
};
