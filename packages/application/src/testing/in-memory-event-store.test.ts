import { describe, expect, test } from "bun:test";
import { canvasCreated, canvasFrozen } from "@hexmote/domain/testing";
import { VersionConflictError } from "../event-store.ts";
import { createInMemoryEventStore } from "./in-memory-event-store.ts";

describe("in-memory event store", () => {
  test("starts empty at version 0", async () => {
    const store = createInMemoryEventStore();

    expect(await store.read()).toEqual({ events: [], version: 0 });
  });

  test("appends events and reads them back with the new version", async () => {
    const store = createInMemoryEventStore();

    await store.append({ events: [canvasCreated, canvasFrozen()], expectedVersion: 0 });

    expect(await store.read()).toEqual({ events: [canvasCreated, canvasFrozen()], version: 2 });
  });

  test("rejects an append with a stale expected version", async () => {
    const store = createInMemoryEventStore([canvasCreated]);

    const appending = store.append({ events: [canvasFrozen()], expectedVersion: 0 });

    await expect(appending).rejects.toBeInstanceOf(VersionConflictError);
  });
});
