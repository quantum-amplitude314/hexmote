import type { CanvasState } from "../../canvas/canvas-state.ts";
import type { FreezeCanvas } from "../../canvas/commands.ts";
import { accepted, rejected } from "../../canvas/decision.ts";
import type { CanvasFrozen } from "../../canvas/events.ts";

export const decideFreezeCanvas = ({
  state,
  command,
}: {
  state: CanvasState;
  command: FreezeCanvas;
}) => {
  if (state.status === "none") return rejected({ reason: "noCanvas" });

  const { reason, at } = command;
  if (state.freezes.has(reason)) return accepted([]);

  const frozen: CanvasFrozen = { type: "CanvasFrozen", reason, at };
  const decision = accepted([frozen]);

  return decision;
};
