import type { CanvasState } from "../../canvas/canvas-state.ts";
import type { CreateCanvas } from "../../canvas/commands.ts";
import { accepted, rejected } from "../../canvas/decision.ts";
import type { CanvasCreated } from "../../canvas/events.ts";

export const decideCreateCanvas = ({
  state,
  command,
}: {
  state: CanvasState;
  command: CreateCanvas;
}) => {
  const { palette, template, at } = command;
  if (state.status !== "none") return rejected({ reason: "canvasExists" });

  const usesColorOutsidePalette = template.some(({ color }) => !palette.includes(color));
  if (usesColorOutsidePalette) return rejected({ reason: "templateColorNotInPalette" });

  const created: CanvasCreated = { type: "CanvasCreated", palette, template, at };
  const decision = accepted([created]);

  return decision;
};
