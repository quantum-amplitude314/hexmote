import type { CanvasEvent } from "@hexmote/domain";

/** `version` is the number of events in the stream; an empty stream is at version 0. */
export type StoredEvents = { events: CanvasEvent[]; version: number };

export interface EventStore {
  read: () => Promise<StoredEvents>;
  append: (input: { events: CanvasEvent[]; expectedVersion: number }) => Promise<void>;
}

export class VersionConflictError extends Error {
  override readonly name = "VersionConflictError";

  constructor({
    expectedVersion,
    actualVersion,
  }: { expectedVersion: number; actualVersion: number }) {
    super(`Expected version ${expectedVersion}, stream is at ${actualVersion}`);
  }
}
