import { runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { VersionConflictError } from "@hexmote/application";
import { canvasCreated, canvasFrozen } from "@hexmote/domain/testing";
import { describe, expect, test } from "vitest";
import { createSqliteEventStore } from "./sqlite-event-store.ts";

const inNewCanvas = (callback: (storage: DurableObjectStorage) => Promise<void>) =>
  runInDurableObject(env.CANVAS.get(env.CANVAS.newUniqueId()), (_canvas, { storage }) =>
    callback(storage),
  );

describe("SQLite event store", () => {
  test("starts empty at version 0", () =>
    inNewCanvas(async (storage) => {
      const store = createSqliteEventStore(storage);

      expect(await store.read()).toEqual({ events: [], version: 0 });
    }));

  test("appends events and reads them back with the new version", () =>
    inNewCanvas(async (storage) => {
      const store = createSqliteEventStore(storage);

      await store.append({ events: [canvasCreated, canvasFrozen()], expectedVersion: 0 });

      expect(await store.read()).toEqual({ events: [canvasCreated, canvasFrozen()], version: 2 });
    }));

  test("stores one row per event with its version and type", () =>
    inNewCanvas(async (storage) => {
      const store = createSqliteEventStore(storage);

      await store.append({ events: [canvasCreated, canvasFrozen()], expectedVersion: 0 });

      const rows = storage.sql.exec("SELECT version, type FROM events ORDER BY version").toArray();
      expect(rows).toEqual([
        { version: 1, type: "CanvasCreated" },
        { version: 2, type: "CanvasFrozen" },
      ]);
    }));

  test("rejects an append with a stale expected version and keeps the stream", () =>
    inNewCanvas(async (storage) => {
      const store = createSqliteEventStore(storage);
      await store.append({ events: [canvasCreated], expectedVersion: 0 });

      const appending = store.append({ events: [canvasFrozen()], expectedVersion: 0 });

      await expect(appending).rejects.toBeInstanceOf(VersionConflictError);
      expect(await store.read()).toEqual({ events: [canvasCreated], version: 1 });
    }));
});
