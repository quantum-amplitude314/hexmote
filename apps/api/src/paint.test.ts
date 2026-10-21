import { cellA, cellOutside, cooldownMs, red } from "@hexmote/domain/testing";
import { describe, expect, test } from "vitest";
import { completeCanvas } from "./testing/complete-canvas.ts";
import { connectLive } from "./testing/live-client.ts";
import { appOfNewCanvas, signedSessionCookie } from "./testing/test-app.ts";

const firstVisitor = "0b6f7a52-0c1e-4b8f-a3b5-6e0f5f3c9d11";
const secondVisitor = "7d2c9e14-5a3b-4f6e-9c8d-2b1a0e4f7c35";

const paintingApp = async () => {
  const { canvas, fetchApp } = await appOfNewCanvas();
  const paint = async ({ body, cookie }: { body: unknown; cookie?: string }) => {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (cookie) headers.Cookie = cookie;
    const response = await fetchApp("/api/paint", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    return response;
  };
  const painting = { canvas, fetchApp, paint, cookie: await signedSessionCookie(firstVisitor) };

  return painting;
};

const paintRed = { cell: cellA, color: red };

describe("Paint route", () => {
  test("paints the cell and sends it to live viewers", async () => {
    const { fetchApp, paint, cookie } = await paintingApp();
    const client = await connectLive({ target: { fetch: fetchApp }, cookie });

    await paint({ body: paintRed, cookie });

    expect(await client.nextMessageOf("cellPainted")).toMatchObject({
      type: "cellPainted",
      cell: cellA,
      color: red,
      paintedPercent: 25,
    });
    client.close();
  });

  test("answers when the next paint is allowed", async () => {
    const { paint, cookie } = await paintingApp();
    const before = Date.now();

    const response = await paint({ body: paintRed, cookie });

    const { status, nextPaintAt } = await response.json<{ status: string; nextPaintAt: number }>();
    expect(status).toBe("painted");
    expect(nextPaintAt).toBeGreaterThanOrEqual(before + cooldownMs);
    expect(nextPaintAt).toBeLessThanOrEqual(Date.now() + cooldownMs);
  });

  test("refuses to paint without a session", async () => {
    const { paint } = await paintingApp();

    const response = await paint({ body: paintRed });

    expect(response.status).toBe(401);
  });

  test("keeps the cooldown per session", async () => {
    const { paint, cookie } = await paintingApp();
    const first = await paint({ body: paintRed, cookie });
    const { nextPaintAt } = await first.json<{ nextPaintAt: number }>();

    const again = await paint({ body: paintRed, cookie });
    const otherVisitor = await paint({
      body: paintRed,
      cookie: await signedSessionCookie(secondVisitor),
    });

    expect(await again.json()).toEqual({
      status: "rejected",
      rejection: { reason: "cooldown", retryAt: nextPaintAt },
    });
    expect(await otherVisitor.json()).toMatchObject({ status: "painted" });
  });

  test("rejects a body that is not a cell and a colour", async () => {
    const { paint, cookie } = await paintingApp();

    const response = await paint({ body: { cell: "a1", color: 12 }, cookie });

    expect(response.status).toBe(400);
  });

  test("reports a completed canvas", async () => {
    const { canvas, paint, cookie } = await paintingApp();
    await completeCanvas({ canvas });

    const response = await paint({ body: paintRed, cookie });

    expect(await response.json()).toEqual({
      status: "rejected",
      rejection: { reason: "canvasCompleted" },
    });
  });

  test("reports a rejection from the canvas", async () => {
    const { paint, cookie } = await paintingApp();

    const response = await paint({ body: { cell: cellOutside, color: red }, cookie });

    expect(await response.json()).toEqual({
      status: "rejected",
      rejection: { reason: "cellOutsideCanvas" },
    });
  });
});
