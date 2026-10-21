import { env } from "cloudflare:workers";
import { cellA, createCanvas, red } from "@hexmote/domain/testing";
import { describe, expect, test } from "vitest";
import { createApp } from "./app.ts";
import { painterOf } from "./painter.ts";
import { connectLive } from "./testing/live-client.ts";

const sessionCookieName = "__Host-hexmote-session";
const knownSessionId = "5f0c2a8e-3d1b-4c7a-9e2f-1b6d8c4a7e90";
const knownSessionCookie = `${sessionCookieName}=${knownSessionId}`;

const appOfNewCanvas = async () => {
  const canvas = env.CANVAS.get(env.CANVAS.newUniqueId());
  await canvas.handleCommand(createCanvas);
  const app = createApp({ canvasOf: () => canvas });
  const target = {
    fetch: async (input: string, init?: RequestInit) =>
      app.request(new URL(input, "http://hexmote"), init, env),
  };

  return target;
};

describe("Live session", () => {
  test("gives a new viewer a session cookie on connect", async () => {
    const target = await appOfNewCanvas();

    const client = await connectLive({ target });

    const setCookie = client.response.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toMatch(new RegExp(`^${sessionCookieName}=[0-9a-f-]{36};`));
    client.close();
  });

  test("names the viewer after their session cookie", async () => {
    const target = await appOfNewCanvas();

    const client = await connectLive({ target, cookie: knownSessionCookie });

    expect(await client.nextMessageOf("welcome")).toEqual({
      type: "welcome",
      you: painterOf(knownSessionId),
    });
    client.close();
  });

  test("ignores a session header sent by the client", async () => {
    const target = await appOfNewCanvas();

    const client = await connectLive({
      target,
      cookie: knownSessionCookie,
      sessionId: "forged",
    });

    expect(await client.nextMessageOf("welcome")).toEqual({
      type: "welcome",
      you: painterOf(knownSessionId),
    });
    client.close();
  });

  test("names the painter of a paint after the same session", async () => {
    const target = await appOfNewCanvas();
    const client = await connectLive({ target, cookie: knownSessionCookie });

    await target.fetch("/api/paint", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: knownSessionCookie },
      body: JSON.stringify({ cell: cellA, color: red }),
    });

    expect(await client.nextMessageOf("cellPainted")).toMatchObject({
      painter: painterOf(knownSessionId),
    });
    client.close();
  });
});
