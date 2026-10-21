import type { CanvasEvent } from "@hexmote/domain";
import type { EventStore } from "../event-store.ts";
import { notImplemented } from "../not-implemented.ts";

type CreateInMemoryEventStore = (initialEvents?: CanvasEvent[]) => EventStore;

/** Adapter for tests: one stream kept in an array. */
export const createInMemoryEventStore: CreateInMemoryEventStore = () => notImplemented();
