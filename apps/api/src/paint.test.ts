import { env } from "cloudflare:workers";
import { cellA, cellOutside, cooldownMs, createCanvas, red } from "@hexmote/domain/testing";
import { describe, expect, test } from "vitest";
import { createApp } from "./app.ts";
import { completeCanvas } from "./testing/complete-canvas.ts";
import { connectLive } from "./testing/live-client.ts";

const sessionCookieName = "__Host-hexmote-session";

const appOfNewCanvas = async () => {
  const canvas = env.CANVAS.get(env.CANVAS.newUniqueId());
  await canvas.handleCommand(createCanvas);
  const app = createApp({ canvasOf: () => canvas });
  const fetchApp = async (input: string, init?: RequestInit) =>
    app.request(new URL(input, "http://hexmote"), init, env);
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
  const painting = { canvas, fetchApp, paint };

  return painting;
};

const sessionCookieOf = (response: Response) => {
  const setCookie = response.headers.get("Set-Cookie") ?? "";
  const [sessionCookie = ""] = setCookie.split(";");

  return sessionCookie;
};

const paintRed = { cell: cellA, color: red };

describe("Paint route", () => {
  test("paints the cell and sends it to live viewers", async () => {
    const { fetchApp, paint } = await appOfNewCanvas();
    const client = await connectLive({ target: { fetch: fetchApp } });

    await paint({ body: paintRed });

    expect(await client.nextMessageOf("cellPainted")).toMatchObject({
      type: "cellPainted",
      cell: cellA,
      color: red,
      paintedPercent: 25,
    });
    client.close();
  });

  test("answers when the next paint is allowed", async () => {
    const { paint } = await appOfNewCanvas();
    const before = Date.now();

    const response = await paint({ body: paintRed });

    const { status, nextPaintAt } = await response.json<{ status: string; nextPaintAt: number }>();
    expect(status).toBe("painted");
    expect(nextPaintAt).toBeGreaterThanOrEqual(before + cooldownMs);
    expect(nextPaintAt).toBeLessThanOrEqual(Date.now() + cooldownMs);
  });

  test("gives a new visitor a session cookie", async () => {
    const { paint } = await appOfNewCanvas();

    const response = await paint({ body: paintRed });

    const setCookie = response.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toMatch(new RegExp(`^${sessionCookieName}=[0-9a-f-]{36};`));
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
  });

  test("keeps the cooldown per session", async () => {
    const { paint } = await appOfNewCanvas();
    const first = await paint({ body: paintRed });
    const { nextPaintAt } = await first.json<{ nextPaintAt: number }>();

    const again = await paint({ body: paintRed, cookie: sessionCookieOf(first) });
    const otherVisitor = await paint({ body: paintRed });

    expect(await again.json()).toEqual({
      status: "rejected",
      rejection: { reason: "cooldown", retryAt: nextPaintAt },
    });
    expect(await otherVisitor.json()).toMatchObject({ status: "painted" });
  });

  test("replaces a session cookie that is not a session id", async () => {
    const { paint } = await appOfNewCanvas();

    const response = await paint({ body: paintRed, cookie: `${sessionCookieName}=forged` });

    expect(sessionCookieOf(response)).toMatch(new RegExp(`^${sessionCookieName}=[0-9a-f-]{36}$`));
  });

  test("rejects a body that is not a cell and a colour", async () => {
    const { paint } = await appOfNewCanvas();

    const response = await paint({ body: { cell: "a1", color: 12 } });

    expect(response.status).toBe(400);
  });

  test("reports a completed canvas", async () => {
    const { canvas, paint } = await appOfNewCanvas();
    await completeCanvas({ canvas });

    const response = await paint({ body: paintRed });

    expect(await response.json()).toEqual({
      status: "rejected",
      rejection: { reason: "canvasCompleted" },
    });
  });

  test("reports a rejection from the canvas", async () => {
    const { paint } = await appOfNewCanvas();

    const response = await paint({ body: { cell: cellOutside, color: red } });

    expect(await response.json()).toEqual({
      status: "rejected",
      rejection: { reason: "cellOutsideCanvas" },
    });
  });
});
