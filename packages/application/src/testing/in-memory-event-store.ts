import type { CanvasEvent } from "@hexmote/domain";
import { type EventStore, VersionConflictError } from "../event-store.ts";

type CreateInMemoryEventStore = (initialEvents?: CanvasEvent[]) => EventStore;

export const createInMemoryEventStore: CreateInMemoryEventStore = (initialEvents = []) => {
  const stream = [...initialEvents];

  const store: EventStore = {
    read: async () => ({ events: [...stream], version: stream.length }),
    append: async ({ events, expectedVersion }) => {
      if (expectedVersion !== stream.length) {
        throw new VersionConflictError({ expectedVersion, actualVersion: stream.length });
      }
      stream.push(...events);
    },
  };

  return store;
};
