import { evictDurableObject, runDurableObjectAlarm } from "cloudflare:test";
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
  resetAfterMs,
  s1,
  s2,
} from "@hexmote/domain/testing";
import { afterEach, describe, expect, test } from "vitest";
import { painterOf } from "./painter.ts";
import { completeCanvas } from "./testing/complete-canvas.ts";
import { connectLive } from "./testing/live-client.ts";

const publicViewOf = (events: CanvasEvent[]) => {
  const { freezes: _freezes, ...view } = replayCanvasView(events);

  return view;
};

type Viewer = { canvas: DurableObjectStub; sessionId?: string };

const clients: Awaited<ReturnType<typeof connectLive>>[] = [];
const connect = async ({ canvas, sessionId = s1 }: Viewer) => {
  const client = await connectLive({ target: canvas, sessionId });
  clients.push(client);

  return client;
};

const createdCanvas = async () => {
  const canvas = env.CANVAS.get(env.CANVAS.newUniqueId());
  await canvas.handleCommand(createCanvas);

  return canvas;
};

/** Past the greeting: the snapshot, the welcome and the online list. */
const connectPastGreeting = async (viewer: Viewer) => {
  const client = await connect(viewer);
  await client.nextMessageOf("presence");

  return client;
};

afterEach(() => {
  for (const client of clients.splice(0)) client.close();
});

describe("Canvas live updates", () => {
  test("sends a snapshot of the public view on connect", async () => {
    const canvas = await createdCanvas();

    const client = await connect({ canvas });

    expect(await client.nextMessage()).toEqual({
      type: "snapshot",
      view: publicViewOf([canvasCreated]),
    });
  });

  test("welcomes a viewer with their painter name", async () => {
    const canvas = await createdCanvas();
    const client = await connect({ canvas, sessionId: s1 });
    await client.nextMessage();

    expect(await client.nextMessage()).toEqual({ type: "welcome", you: painterOf(s1) });
  });

  test("sends everyone the online list by name when someone joins", async () => {
    const canvas = await createdCanvas();
    const first = await connectPastGreeting({ canvas, sessionId: s1 });

    await connect({ canvas, sessionId: s2 });

    const byName = [painterOf(s1), painterOf(s2)].toSorted((one, other) =>
      one.name.localeCompare(other.name),
    );
    expect(await first.nextMessageOf("presence")).toEqual({ type: "presence", online: byName });
  });

  test("counts a painter with two tabs once", async () => {
    const canvas = await createdCanvas();
    const first = await connectPastGreeting({ canvas, sessionId: s1 });

    await connect({ canvas, sessionId: s1 });

    expect(await first.nextMessageOf("presence")).toEqual({
      type: "presence",
      online: [painterOf(s1)],
    });
  });

  test("updates the online list when someone leaves", async () => {
    const canvas = await createdCanvas();
    const first = await connectPastGreeting({ canvas, sessionId: s1 });
    const second = await connectPastGreeting({ canvas, sessionId: s2 });
    await first.nextMessageOf("presence");

    second.close();

    expect(await first.nextMessageOf("presence")).toEqual({
      type: "presence",
      online: [painterOf(s1)],
    });
  });

  test("broadcasts a snapshot when the canvas is created", async () => {
    const canvas = env.CANVAS.get(env.CANVAS.newUniqueId());
    const client = await connectPastGreeting({ canvas });

    await canvas.handleCommand(createCanvas);

    expect(await client.nextMessage()).toEqual({
      type: "snapshot",
      view: publicViewOf([canvasCreated]),
    });
  });

  test("broadcasts a painted cell with its painter and the painted share to every client", async () => {
    const canvas = await createdCanvas();
    const first = await connectPastGreeting({ canvas, sessionId: s1 });
    const second = await connectPastGreeting({ canvas, sessionId: s2 });

    await canvas.handleCommand(paintCell({ cell: cellA, color: red, sessionId: s2 }));

    const painted = {
      type: "cellPainted",
      cell: cellA,
      color: red,
      paintedPercent: 25,
      painter: painterOf(s2),
    };
    expect(await first.nextMessageOf("cellPainted")).toEqual(painted);
    expect(await second.nextMessageOf("cellPainted")).toEqual(painted);
  });

  test("broadcasts the status without the freeze reason", async () => {
    const canvas = await createdCanvas();
    const client = await connectPastGreeting({ canvas });

    await canvas.handleCommand(freezeCanvas({ reason: "budget" }));

    expect(await client.nextMessage()).toEqual({ type: "status", status: "frozen", resetAt: null });
  });

  test("broadcasts the completed status with the time of the new round", async () => {
    const canvas = await createdCanvas();
    const client = await connectPastGreeting({ canvas });
    const at = Date.now();

    await completeCanvas({ canvas, at });

    expect(await client.nextMessageOf("status")).toEqual({
      type: "status",
      status: "completed",
      resetAt: at + resetAfterMs,
    });
  });

  test("sends viewers the new round when it starts", async () => {
    const canvas = await createdCanvas();
    const client = await connectPastGreeting({ canvas });
    await completeCanvas({ canvas });
    await client.nextMessageOf("status");

    await runDurableObjectAlarm(canvas);

    expect(await client.nextMessageOf("snapshot")).toEqual({
      type: "snapshot",
      view: publicViewOf([canvasCreated]),
    });
  });

  test("sends nothing for a rejected command", async () => {
    const canvas = await createdCanvas();
    const client = await connectPastGreeting({ canvas });

    await canvas.handleCommand(paintCell({ cell: cellOutside, color: red }));
    await canvas.handleCommand(paintCell({ cell: cellA, color: red }));

    expect(await client.nextMessage()).toMatchObject({ type: "cellPainted", cell: cellA });
  });

  test("keeps broadcasting after the Durable Object hibernates", async () => {
    const id = env.CANVAS.newUniqueId();
    await env.CANVAS.get(id).handleCommand(createCanvas);
    const client = await connectPastGreeting({ canvas: env.CANVAS.get(id) });
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
