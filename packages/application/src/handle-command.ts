import {
  type CanvasCommand,
  type CanvasConfig,
  type Decision,
  decide,
  replay,
} from "@hexmote/domain";
import type { EventStore } from "./event-store.ts";

type HandleCommand = (input: {
  store: EventStore;
  command: CanvasCommand;
  config: CanvasConfig;
}) => Promise<Decision>;

export const handleCommand: HandleCommand = async ({ store, command, config }) => {
  const { events, version } = await store.read();
  const decision = decide({ state: replay(events), command, config });
  if (decision.status === "accepted" && decision.events.length > 0) {
    await store.append({ events: decision.events, expectedVersion: version });
  }

  return decision;
};
