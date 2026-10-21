import type { CanvasState } from "../../canvas/canvas-state.ts";
import type { UnfreezeCanvas } from "../../canvas/commands.ts";
import { accepted, rejected } from "../../canvas/decision.ts";
import type { CanvasUnfrozen } from "../../canvas/events.ts";

export const decideUnfreezeCanvas = ({
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
