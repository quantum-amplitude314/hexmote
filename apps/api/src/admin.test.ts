import { evictDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { emptyCanvasView, replayCanvasView } from "@hexmote/domain";
import {
  canvasCreated,
  canvasFrozen,
  freezeCanvas,
  palette,
  template,
} from "@hexmote/domain/testing";
import { describe, expect, test } from "vitest";
import { handleAdminRequest } from "./admin.ts";

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
    await canvas.handleCommand(freezeCanvas({ reason: "budget" }));
    await send(freezeRequest);

    await send(unfreezeRequest);

    expect((await canvas.getView()).freezes).toEqual(["budget"]);
  });

  test("deletes the canvas so it can be created again", async () => {
    const { canvas, send } = adminOfNewCanvas();
    await send(createCanvasRequest);

    const response = await send(deleteCanvasRequest);

    expect(response.status).toBe(204);
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
    await canvas.handleCommand(freezeCanvas({ reason: "budget" }));

    const response = await send(deleteCanvasRequest);

    expect(response.status).toBe(409);
    expect(await canvas.getView()).toEqual(
      replayCanvasView([canvasCreated, canvasFrozen({ reason: "budget" })]),
    );
  });

  test("answers 404 for an unknown admin route", async () => {
    const { send } = adminOfNewCanvas();

    const response = await send({ method: "GET", path: "/admin/unknown" });

    expect(response.status).toBe(404);
  });
});
