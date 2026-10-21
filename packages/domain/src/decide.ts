import type { CanvasState } from "./canvas-state.ts";
import { cellKey } from "./cell.ts";
import type {
  CanvasCommand,
  CreateCanvas,
  FreezeCanvas,
  PaintCell,
  UnfreezeCanvas,
} from "./commands.ts";
import type {
  CanvasCreated,
  CanvasEvent,
  CanvasFrozen,
  CanvasUnfrozen,
  CellPainted,
} from "./events.ts";

export type Rejection =
  | { reason: "canvasExists" }
  | { reason: "templateColorNotInPalette" }
  | { reason: "noCanvas" }
  | { reason: "cellOutsideCanvas" }
  | { reason: "colorNotInPalette" }
  | { reason: "cooldown"; retryAt: number }
  | { reason: "canvasFrozen" };

export type Decision =
  | { status: "accepted"; events: CanvasEvent[] }
  | { status: "rejected"; rejection: Rejection };

const accepted = (events: CanvasEvent[]) => {
  const decision: Decision = { status: "accepted", events };

  return decision;
};

const rejected = (rejection: Rejection) => {
  const decision: Decision = { status: "rejected", rejection };

  return decision;
};

const decideCreateCanvas = ({ state, command }: { state: CanvasState; command: CreateCanvas }) => {
  const { palette, template, at } = command;
  if (state.status !== "none") return rejected({ reason: "canvasExists" });

  const usesColorOutsidePalette = template.some(({ color }) => !palette.includes(color));
  if (usesColorOutsidePalette) return rejected({ reason: "templateColorNotInPalette" });

  const created: CanvasCreated = { type: "CanvasCreated", palette, template, at };
  const decision = accepted([created]);

  return decision;
};

const decidePaintCell = ({
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

const decideFreezeCanvas = ({ state, command }: { state: CanvasState; command: FreezeCanvas }) => {
  if (state.status === "none") return rejected({ reason: "noCanvas" });

  const { reason, at } = command;
  if (state.freezes.has(reason)) return accepted([]);

  const frozen: CanvasFrozen = { type: "CanvasFrozen", reason, at };
  const decision = accepted([frozen]);

  return decision;
};

const decideUnfreezeCanvas = ({
  state,
  command,
}: {
  state: CanvasState;
  command: UnfreezeCanvas;
}) => {
  if (state.status === "none") return rejected({ reason: "noCanvas" });

  const { reason, at } = command;
  if (!state.freezes.has(reason)) return accepted([]);

  const unfrozen: CanvasUnfrozen = { type: "CanvasUnfrozen", reason, at };
  const decision = accepted([unfrozen]);

  return decision;
};

export const decide = ({
  state,
  command,
  cooldownMs,
}: {
  state: CanvasState;
  command: CanvasCommand;
  cooldownMs: number;
}) => {
  switch (command.type) {
    case "CreateCanvas":
      return decideCreateCanvas({ state, command });
    case "PaintCell":
      return decidePaintCell({ state, command, cooldownMs });
    case "FreezeCanvas":
      return decideFreezeCanvas({ state, command });
    case "UnfreezeCanvas":
      return decideUnfreezeCanvas({ state, command });
    default:
      return command satisfies never;
  }
};
