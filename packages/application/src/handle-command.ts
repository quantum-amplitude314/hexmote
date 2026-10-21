import type { CanvasCommand, Decision } from "@hexmote/domain";
import type { EventStore } from "./event-store.ts";
import { notImplemented } from "./not-implemented.ts";

type HandleCommand = (input: {
  store: EventStore;
  command: CanvasCommand;
  cooldownMs: number;
}) => Promise<Decision>;

/** Read the stream, replay it, decide, and append the accepted events. */
export const handleCommand: HandleCommand = () => notImplemented();
