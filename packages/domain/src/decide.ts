import type { CanvasState } from "./canvas-state.ts";
import type { CanvasCommand } from "./commands.ts";
import type { CanvasEvent } from "./events.ts";
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

type Decide = (input: {
  state: CanvasState;
  command: CanvasCommand;
  cooldownMs: number;
}) => Decision;

export const decide: Decide = () => notImplemented();
