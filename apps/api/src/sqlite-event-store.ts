import type { EventStore } from "@hexmote/application";
import { notImplemented } from "./not-implemented.ts";

type CreateSqliteEventStore = (storage: DurableObjectStorage) => EventStore;

/** Adapter: one canvas stream in the Durable Object's SQLite `events` table. */
export const createSqliteEventStore: CreateSqliteEventStore = () => notImplemented();
