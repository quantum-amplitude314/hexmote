import { describe, expect, spyOn, test } from "bun:test";
import {
  canvasCreated,
  canvasFrozen,
  cellA,
  cellPainted,
  config,
  createCanvas,
  freezeCanvas,
  paintCell,
  red,
} from "@hexmote/domain/testing";
import { VersionConflictError } from "./event-store.ts";
import { handleCommand } from "./handle-command.ts";
import { createInMemoryEventStore } from "./testing/in-memory-event-store.ts";

describe("handleCommand", () => {
  test("creates the stream with the first command", async () => {
    const store = createInMemoryEventStore();

    const decision = await handleCommand({ store, command: createCanvas, config });

    expect(decision).toEqual({ status: "accepted", events: [canvasCreated] });
    expect(await store.read()).toEqual({ events: [canvasCreated], version: 1 });
  });

  test("appends accepted events at the version it read", async () => {
    const store = createInMemoryEventStore([canvasCreated]);
    const painted = cellPainted({ cell: cellA, color: red });

    const decision = await handleCommand({
      store,
      command: paintCell({ cell: cellA, color: red }),
      config,
    });

    expect(decision).toEqual({ status: "accepted", events: [painted] });
    expect(await store.read()).toEqual({ events: [canvasCreated, painted], version: 2 });
  });

  test("returns a rejection and appends nothing", async () => {
    const store = createInMemoryEventStore([canvasCreated]);
    const append = spyOn(store, "append");

    const decision = await handleCommand({ store, command: createCanvas, config });

    expect(decision).toEqual({ status: "rejected", rejection: { reason: "canvasExists" } });
    expect(append).not.toHaveBeenCalled();
  });

  test("appends nothing when the decision has no events", async () => {
    const store = createInMemoryEventStore([canvasCreated, canvasFrozen()]);
    const append = spyOn(store, "append");

    const decision = await handleCommand({ store, command: freezeCanvas(), config });

    expect(decision).toEqual({ status: "accepted", events: [] });
    expect(append).not.toHaveBeenCalled();
  });

  test("lets a version conflict reach the caller", async () => {
    const store = createInMemoryEventStore([canvasCreated]);
    spyOn(store, "append").mockRejectedValue(
      new VersionConflictError({ expectedVersion: 1, actualVersion: 2 }),
    );

    const handling = handleCommand({ store, command: freezeCanvas(), config });

    await expect(handling).rejects.toBeInstanceOf(VersionConflictError);
  });
});
