import { cellA, red } from "@hexmote/domain/testing";
import { describe, expect, test } from "vitest";
import { painterOf } from "./painter.ts";
import { connectLive } from "./testing/live-client.ts";
import { appOfNewCanvas, signedSessionCookie } from "./testing/test-app.ts";

const knownSessionId = "5f0c2a8e-3d1b-4c7a-9e2f-1b6d8c4a7e90";

const liveApp = async () => {
  const { fetchApp } = await appOfNewCanvas();
  const live = { target: { fetch: fetchApp }, cookie: await signedSessionCookie(knownSessionId) };

  return live;
};

describe("Live session", () => {
  test("refuses a live connection without a session", async () => {
    const { target } = await liveApp();

    const response = await target.fetch("/live", { headers: { Upgrade: "websocket" } });

    expect(response.status).toBe(401);
    expect(response.webSocket).toBeNull();
  });

  test("names the viewer after their session", async () => {
    const { target, cookie } = await liveApp();

    const client = await connectLive({ target, cookie });

    expect(await client.nextMessageOf("welcome")).toEqual({
      type: "welcome",
      you: painterOf(knownSessionId),
    });
    client.close();
  });

  test("ignores a session header sent by the client", async () => {
    const { target, cookie } = await liveApp();

    const client = await connectLive({ target, cookie, sessionId: "forged" });

    expect(await client.nextMessageOf("welcome")).toEqual({
      type: "welcome",
      you: painterOf(knownSessionId),
    });
    client.close();
  });

  test("names the painter of a paint after the same session", async () => {
    const { target, cookie } = await liveApp();
    const client = await connectLive({ target, cookie });

    await target.fetch("/api/paint", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ cell: cellA, color: red }),
    });

    expect(await client.nextMessageOf("cellPainted")).toMatchObject({
      painter: painterOf(knownSessionId),
    });
    client.close();
  });
});
