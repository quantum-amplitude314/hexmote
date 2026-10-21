import { exports } from "cloudflare:workers";
import { emptyCanvasView } from "@hexmote/domain";
import { describe, expect, test } from "vitest";
import { connectLive } from "./testing/live-client.ts";

describe("API Worker", () => {
  test("forwards /live to the canvas", async () => {
    const client = await connectLive({ target: exports.default });

    const { freezes: _freezes, ...view } = emptyCanvasView;
    expect(await client.nextMessage()).toEqual({ type: "snapshot", view });
    client.close();
  });

  test("forwards /admin to the canvas", async () => {
    const response = await exports.default.fetch("http://hexmote/admin/canvas", {
      method: "DELETE",
    });

    expect(response.status).toBe(204);
  });

  test("forwards /api to the paint route", async () => {
    const response = await exports.default.fetch("http://hexmote/api/paint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cell: { axialQ: 0, axialR: 0 }, color: "#e50000" }),
    });

    expect(await response.json()).toEqual({
      status: "rejected",
      rejection: { reason: "noCanvas" },
    });
  });
});
