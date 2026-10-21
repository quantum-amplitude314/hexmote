import type { CanvasEvent } from "./events.ts";

export type Rejection =
  | { reason: "canvasExists" }
  | { reason: "templateColorNotInPalette" }
  | { reason: "noCanvas" }
  | { reason: "cellOutsideCanvas" }
  | { reason: "colorNotInPalette" }
  | { reason: "cooldown"; retryAt: number }
  | { reason: "canvasFrozen" }
  | { reason: "canvasCompleted" };

export type Decision =
  | { status: "accepted"; events: CanvasEvent[] }
  | { status: "rejected"; rejection: Rejection };

export const accepted = (events: CanvasEvent[]) => {
  const decision: Decision = { status: "accepted", events };

  return decision;
};

export const rejected = (rejection: Rejection) => {
  const decision: Decision = { status: "rejected", rejection };

  return decision;
};
