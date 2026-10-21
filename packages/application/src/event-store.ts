import type { CanvasEvent } from "@hexmote/domain";

/** `version` is the number of events in the stream; an empty stream is at version 0. */
export type StoredEvents = { events: CanvasEvent[]; version: number };

/** Port: the application reads and appends one canvas stream through it. */
export interface EventStore {
  read: () => Promise<StoredEvents>;
  append: (input: { events: CanvasEvent[]; expectedVersion: number }) => Promise<void>;
}

/** Another writer appended after the read: the stream is past `expectedVersion`. */
export class VersionConflictError extends Error {
  override readonly name = "VersionConflictError";

  constructor({
    expectedVersion,
    actualVersion,
  }: { expectedVersion: number; actualVersion: number }) {
    super(`Expected version ${expectedVersion}, stream is at ${actualVersion}`);
  }
}
