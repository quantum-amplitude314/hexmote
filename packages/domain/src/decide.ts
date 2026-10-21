import type { CanvasState } from "./canvas-state.ts";
import type { CanvasCommand, CreateCanvas } from "./commands.ts";
import type { CanvasCreated, CanvasEvent } from "./events.ts";
import { notImplemented } from "./not-implemented.ts";

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

export const decide = ({
  state,
  command,
}: {
  state: CanvasState;
  command: CanvasCommand;
  cooldownMs: number;
}) => {
  switch (command.type) {
    case "CreateCanvas":
      return decideCreateCanvas({ state, command });
    default:
      return notImplemented();
  }
};
