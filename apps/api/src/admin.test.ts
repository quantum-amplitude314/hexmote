import { evictDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { emptyCanvasView, replayCanvasView } from "@hexmote/domain";
import {
  canvasCreated,
  canvasFrozen,
  cellA,
  paintCell,
  palette,
  red,
  template,
} from "@hexmote/domain/testing";
import { describe, expect, test } from "vitest";
import { handleAdminRequest } from "./admin.ts";
import { completeCanvas } from "./testing/complete-canvas.ts";
import { freezeForBudget } from "./testing/usage.ts";

const emote = { palette, template };

const adminOfNewCanvas = () => {
  const canvas = env.CANVAS.get(env.CANVAS.newUniqueId());
  const send = ({ method, path }: { method: string; path: string }) =>
    handleAdminRequest({
      request: new Request(`http://hexmote${path}`, { method }),
      canvas,
      emote,
    });
  const admin = { canvas, send };

  return admin;
};

const createCanvasRequest = { method: "POST", path: "/admin/canvas" };
const deleteCanvasRequest = { method: "DELETE", path: "/admin/canvas" };
const freezeRequest = { method: "POST", path: "/admin/freeze" };
const unfreezeRequest = { method: "POST", path: "/admin/unfreeze" };
const resetRequest = { method: "POST", path: "/admin/reset" };
const statusRequest = { method: "GET", path: "/admin/canvas" };

describe("Admin routes", () => {
  test("creates the canvas with the emote", async () => {
    const { canvas, send } = adminOfNewCanvas();

    const response = await send(createCanvasRequest);

    expect(response.status).toBe(200);
    expect(await canvas.getView()).toEqual(replayCanvasView([canvasCreated]));
  });

  test("reports a canvas that already exists", async () => {
    const { send } = adminOfNewCanvas();
    await send(createCanvasRequest);

    const response = await send(createCanvasRequest);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      status: "rejected",
      rejection: { reason: "canvasExists" },
    });
  });

  test("freezes the canvas manually", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);

    const response = await send(freezeRequest);

    expect(response.status).toBe(200);
    expect((await canvas.getView()).freezes).toEqual(["manual"]);
  });

  test("lifts the manual freeze", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);
    await send(freezeRequest);

    const response = await send(unfreezeRequest);

    expect(response.status).toBe(200);
    expect((await canvas.getView()).freezes).toEqual([]);
  });

  test("leaves the budget freeze in place when unfreezing", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);
    await freezeForBudget(canvas);
    await send(freezeRequest);

    await send(unfreezeRequest);

    expect((await canvas.getView()).freezes).toEqual(["budget"]);
  });

  test("deletes the canvas so it can be created again", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);

    const response = await send(deleteCanvasRequest);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "deleted" });
    expect(await canvas.getView()).toEqual(emptyCanvasView);
    expect((await send(createCanvasRequest)).status).toBe(200);
  });

  test("keeps the canvas deleted after eviction", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);
    await send(deleteCanvasRequest);

    await evictDurableObject(canvas);

    expect(await canvas.getView()).toEqual(emptyCanvasView);
  });

  test("refuses to delete while the budget freeze is active", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);
    await freezeForBudget(canvas);

    const response = await send(deleteCanvasRequest);

    expect(response.status).toBe(409);
    expect(await canvas.getView()).toEqual(
      replayCanvasView([canvasCreated, canvasFrozen({ reason: "budget" })]),
    );
  });

  test("starts a new round with the same emote on demand", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);
    await canvas.handleCommand(paintCell({ cell: cellA, color: red }));

    const response = await send(resetRequest);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "reset" });
    expect(await canvas.getView()).toEqual(replayCanvasView([canvasCreated]));
  });

  test("refuses to reset while the budget freeze is active", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);
    await completeCanvas({ canvas });
    await freezeForBudget(canvas);

    const response = await send(resetRequest);

    expect(response.status).toBe(409);
    expect((await canvas.getView()).freezes).toEqual(["budget"]);
  });

  test("refuses to reset before the canvas exists", async () => {
    const { send } = adminOfNewCanvas();

    const response = await send(resetRequest);

    expect(response.status).toBe(409);
  });

  test("reports that there is no canvas yet", async () => {
    const { send } = adminOfNewCanvas();

    const response = await send(statusRequest);

    expect(await response.json()).toEqual({
      exists: false,
      status: "open",
      paintedPercent: 0,
      freezes: [],
      resetAt: null,
      budget: {
        dayCount: 0,
        perDay: Number(env.BUDGET_PER_DAY),
        cycleCount: 0,
        perCycle: Number(env.BUDGET_PER_CYCLE),
      },
    });
  });

  test("reports the requests counted against the budget", async () => {
    const { send } = adminOfNewCanvas();
    await send(createCanvasRequest);
    await send(freezeRequest);

    const response = await send(statusRequest);

    expect(await response.json()).toMatchObject({ budget: { dayCount: 2, cycleCount: 2 } });
  });

  test("reports the status of the canvas", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);
    await completeCanvas({ canvas, at: 1_000 });

    const response = await send(statusRequest);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      exists: true,
      status: "completed",
      paintedPercent: 100,
      resetAt: 1_000 + Number(env.RESET_AFTER_MS),
    });
  });

  test("reports why the canvas is frozen, budget included", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);
    await freezeForBudget(canvas);
    await send(freezeRequest);

    const response = await send(statusRequest);

    expect(await response.json()).toMatchObject({
      status: "frozen",
      freezes: ["budget", "manual"],
    });
  });

  test("answers 404 for an unknown admin route", async () => {
    const { send } = adminOfNewCanvas();

    const response = await send({ method: "GET", path: "/admin/unknown" });

    expect(response.status).toBe(404);
  });
});
