import { type CanvasCommand, type Decision, decide, replay } from "@hexmote/domain";
import type { EventStore } from "./event-store.ts";

type HandleCommand = (input: {
  store: EventStore;
  command: CanvasCommand;
  cooldownMs: number;
}) => Promise<Decision>;

export const handleCommand: HandleCommand = async ({ store, command, cooldownMs }) => {
  const { events, version } = await store.read();
  const decision = decide({ state: replay(events), command, cooldownMs });
  if (decision.status === "accepted" && decision.events.length > 0) {
    await store.append({ events: decision.events, expectedVersion: version });
  }

  return decision;
};
