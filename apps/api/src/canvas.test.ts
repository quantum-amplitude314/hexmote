import { evictDurableObject, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { emptyCanvasView, replayCanvasView, type Usage } from "@hexmote/domain";
import {
  canvasCreated,
  cellA,
  cellOutside,
  cellPainted,
  cooldownMs,
  createCanvas,
  minutes,
  paintCell,
  red,
  resetAfterMs,
  seconds,
  t,
} from "@hexmote/domain/testing";
import { describe, expect, test } from "vitest";
import { completeCanvas } from "./testing/complete-canvas.ts";
import { connectLive } from "./testing/live-client.ts";
import {
  freezeForBudget,
  perCycle,
  perDay,
  storedUsageOf,
  storeUsage,
  usageToday,
} from "./testing/usage.ts";

const newCanvasId = () => env.CANVAS.newUniqueId();

describe("Canvas Durable Object", () => {
  test("returns the decision for a command", async () => {
    const canvas = env.CANVAS.get(newCanvasId());

    const decision = await canvas.handleCommand(createCanvas);

    expect(decision).toEqual({ status: "accepted", events: [canvasCreated] });
  });

  test("decides against the events it stored", async () => {
    const canvas = env.CANVAS.get(newCanvasId());
    await canvas.handleCommand(createCanvas);

    const decision = await canvas.handleCommand(createCanvas);

    expect(decision).toEqual({ status: "rejected", rejection: { reason: "canvasExists" } });
  });

  test("rebuilds the canvas from its events after eviction", async () => {
    const id = newCanvasId();
    await env.CANVAS.get(id).handleCommand(createCanvas);
    await evictDurableObject(env.CANVAS.get(id));

    const decision = await env.CANVAS.get(id).handleCommand(createCanvas);

    expect(decision).toEqual({ status: "rejected", rejection: { reason: "canvasExists" } });
  });

  test("applies the cooldown from the environment", async () => {
    const canvas = env.CANVAS.get(newCanvasId());
    await canvas.handleCommand(createCanvas);
    await canvas.handleCommand(paintCell({ cell: cellA, color: red }));

    const decision = await canvas.handleCommand(
      paintCell({ cell: cellA, color: red, at: t + seconds(1) }),
    );

    expect(decision).toEqual({
      status: "rejected",
      rejection: { reason: "cooldown", retryAt: t + cooldownMs },
    });
  });
});

describe("Canvas read model", () => {
  const paintedA = cellPainted({ cell: cellA, color: red });

  test("shows an empty view before the canvas exists", async () => {
    const canvas = env.CANVAS.get(newCanvasId());

    expect(await canvas.getView()).toEqual(emptyCanvasView);
  });

  test("shows the view projected from its events", async () => {
    const canvas = env.CANVAS.get(newCanvasId());
    await canvas.handleCommand(createCanvas);
    await canvas.handleCommand(paintCell({ cell: cellA, color: red }));

    expect(await canvas.getView()).toEqual(replayCanvasView([canvasCreated, paintedA]));
  });

  test("updates the view with the events of each accepted command", async () => {
    const canvas = env.CANVAS.get(newCanvasId());
    await canvas.handleCommand(createCanvas);
    await canvas.getView();

    await canvas.handleCommand(paintCell({ cell: cellA, color: red }));

    expect(await canvas.getView()).toEqual(replayCanvasView([canvasCreated, paintedA]));
  });

  test("leaves the view unchanged after a rejected command", async () => {
    const canvas = env.CANVAS.get(newCanvasId());
    await canvas.handleCommand(createCanvas);
    await canvas.getView();

    await canvas.handleCommand(paintCell({ cell: cellOutside, color: red }));

    expect(await canvas.getView()).toEqual(replayCanvasView([canvasCreated]));
  });

  test("rebuilds the view after eviction", async () => {
    const id = newCanvasId();
    await env.CANVAS.get(id).handleCommand(createCanvas);
    await env.CANVAS.get(id).handleCommand(paintCell({ cell: cellA, color: red }));
    await evictDurableObject(env.CANVAS.get(id));

    const view = await env.CANVAS.get(id).getView();

    expect(view).toEqual(replayCanvasView([canvasCreated, paintedA]));
  });
});

describe("Canvas rounds", () => {
  const completedCanvas = async (at = Date.now()) => {
    const canvas = env.CANVAS.get(newCanvasId());
    await canvas.handleCommand(createCanvas);
    await completeCanvas({ canvas, at });

    return canvas;
  };
  const alarmOf = (canvas: DurableObjectStub) =>
    runInDurableObject(canvas, (_canvas, { storage }) => storage.getAlarm());

  test("schedules the new round for the reset time of the completed canvas", async () => {
    const at = Date.now();

    const canvas = await completedCanvas(at);

    expect(await alarmOf(canvas)).toBe(at + resetAfterMs);
  });

  test("starts a new round with the same emote when the alarm runs", async () => {
    const canvas = await completedCanvas();

    expect(await runDurableObjectAlarm(canvas)).toBe(true);

    expect(await canvas.getView()).toEqual(replayCanvasView([canvasCreated]));
  });

  test("keeps the new round after eviction", async () => {
    const canvas = await completedCanvas();
    await runDurableObjectAlarm(canvas);

    await evictDurableObject(canvas);

    expect(await canvas.getView()).toEqual(replayCanvasView([canvasCreated]));
  });

  test("waits during a budget freeze and tries again in an hour", async () => {
    const canvas = await completedCanvas();
    await freezeForBudget(canvas);
    const before = Date.now();

    await runDurableObjectAlarm(canvas);

    const { status, freezes, resetAt } = await canvas.getView();
    expect({ status, freezes }).toEqual({ status: "frozen", freezes: ["budget"] });
    expect(resetAt).not.toBeNull();
    expect(await alarmOf(canvas)).toBeGreaterThanOrEqual(before + minutes(60));
  });
});

describe("Budget guard", () => {
  const pastUsage: Usage = {
    day: "2000-01-01",
    dayCount: perDay + 1,
    cycleStart: "2000-01-01",
    cycleCount: perCycle + 1,
  };
  const createdCanvas = async () => {
    const canvas = env.CANVAS.get(newCanvasId());
    await canvas.handleCommand(createCanvas);

    return canvas;
  };

  test("counts each command and live connection", async () => {
    const canvas = await createdCanvas();
    await canvas.handleCommand(paintCell({ cell: cellA, color: red }));
    (await connectLive({ target: canvas })).close();

    expect(await storedUsageOf(canvas)).toEqual(usageToday({ dayCount: 3, cycleCount: 3 }));
  });

  test("freezes the canvas for the budget once the day's limit is passed", async () => {
    const canvas = await createdCanvas();
    await storeUsage({ canvas, usage: usageToday({ dayCount: perDay, cycleCount: perDay }) });

    const decision = await canvas.handleCommand(paintCell({ cell: cellA, color: red }));

    expect(decision).toEqual({ status: "rejected", rejection: { reason: "canvasFrozen" } });
    expect((await canvas.getView()).freezes).toEqual(["budget"]);
  });

  test("lifts the budget freeze with the first command of a new day", async () => {
    const canvas = await createdCanvas();
    await freezeForBudget(canvas);
    await storeUsage({ canvas, usage: pastUsage });

    const decision = await canvas.handleCommand(paintCell({ cell: cellA, color: red }));

    expect(decision.status).toBe("accepted");
    expect((await canvas.getView()).freezes).toEqual([]);
  });

  test("keeps the usage through a reset", async () => {
    const canvas = await createdCanvas();
    await storeUsage({ canvas, usage: usageToday({ dayCount: 50, cycleCount: 60 }) });

    await canvas.resetCanvas();

    expect(await storedUsageOf(canvas)).toEqual(usageToday({ dayCount: 51, cycleCount: 61 }));
  });

  test("lifts an expired budget freeze when the round alarm runs, then starts the new round", async () => {
    const canvas = await createdCanvas();
    await completeCanvas({ canvas });
    await freezeForBudget(canvas);
    await storeUsage({ canvas, usage: pastUsage });

    await runDurableObjectAlarm(canvas);

    expect(await canvas.getView()).toEqual(replayCanvasView([canvasCreated]));
  });
});
