import { evictDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import {
  canvasCreated,
  cellA,
  cooldownMs,
  createCanvas,
  paintCell,
  red,
  seconds,
  t,
} from "@hexmote/domain/testing";
import { describe, expect, test } from "vitest";

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
