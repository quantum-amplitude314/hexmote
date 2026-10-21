import { evictDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { type CanvasEvent, replayCanvasView } from "@hexmote/domain";
import {
  canvasCreated,
  cellA,
  cellOutside,
  createCanvas,
  freezeCanvas,
  paintCell,
  red,
} from "@hexmote/domain/testing";
import { afterEach, describe, expect, test } from "vitest";
import { connectLive } from "./testing/live-client.ts";

const publicViewOf = (events: CanvasEvent[]) => {
  const { freezes: _freezes, ...view } = replayCanvasView(events);

  return view;
};

const clients: Awaited<ReturnType<typeof connectLive>>[] = [];
const connect = async (target: Parameters<typeof connectLive>[0]) => {
  const client = await connectLive(target);
  clients.push(client);

  return client;
};

const createdCanvas = async () => {
  const canvas = env.CANVAS.get(env.CANVAS.newUniqueId());
  await canvas.handleCommand(createCanvas);

  return canvas;
};

const connectPastSnapshot = async (target: Parameters<typeof connectLive>[0]) => {
  const client = await connect(target);
  await client.nextMessage();

  return client;
};

afterEach(() => {
  for (const client of clients.splice(0)) client.close();
});

describe("Canvas live updates", () => {
  test("sends a snapshot of the public view on connect", async () => {
    const canvas = await createdCanvas();

    const client = await connect(canvas);

    expect(await client.nextMessage()).toEqual({
      type: "snapshot",
      view: publicViewOf([canvasCreated]),
    });
  });

  test("broadcasts a snapshot when the canvas is created", async () => {
    const canvas = env.CANVAS.get(env.CANVAS.newUniqueId());
    const client = await connectPastSnapshot(canvas);

    await canvas.handleCommand(createCanvas);

    expect(await client.nextMessage()).toEqual({
      type: "snapshot",
      view: publicViewOf([canvasCreated]),
    });
  });

  test("broadcasts a painted cell with the new completion to every client", async () => {
    const canvas = await createdCanvas();
    const first = await connectPastSnapshot(canvas);
    const second = await connectPastSnapshot(canvas);

    await canvas.handleCommand(paintCell({ cell: cellA, color: red }));

    const painted = { type: "cellPainted", cell: cellA, color: red, completionPercent: 25 };
    expect(await first.nextMessage()).toEqual(painted);
    expect(await second.nextMessage()).toEqual(painted);
  });

  test("broadcasts the status without the freeze reason", async () => {
    const canvas = await createdCanvas();
    const client = await connectPastSnapshot(canvas);

    await canvas.handleCommand(freezeCanvas({ reason: "budget" }));

    expect(await client.nextMessage()).toEqual({ type: "status", status: "frozen" });
  });

  test("sends nothing for a rejected command", async () => {
    const canvas = await createdCanvas();
    const client = await connectPastSnapshot(canvas);

    await canvas.handleCommand(paintCell({ cell: cellOutside, color: red }));
    await canvas.handleCommand(paintCell({ cell: cellA, color: red }));

    expect(await client.nextMessage()).toMatchObject({ type: "cellPainted", cell: cellA });
  });

  test("keeps broadcasting after the Durable Object hibernates", async () => {
    const id = env.CANVAS.newUniqueId();
    await env.CANVAS.get(id).handleCommand(createCanvas);
    const client = await connectPastSnapshot(env.CANVAS.get(id));
    await evictDurableObject(env.CANVAS.get(id));

    await env.CANVAS.get(id).handleCommand(paintCell({ cell: cellA, color: red }));

    expect(await client.nextMessage()).toMatchObject({ type: "cellPainted", cell: cellA });
  });

  test("answers a request without a WebSocket upgrade with 426", async () => {
    const canvas = await createdCanvas();

    const response = await canvas.fetch("http://hexmote/live");
    await response.body?.cancel();

    expect(response.status).toBe(426);
  });
});
