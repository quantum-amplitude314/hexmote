import { exports } from "cloudflare:workers";
import { emptyCanvasView } from "@hexmote/domain";
import { describe, expect, test } from "vitest";
import { connectLive } from "./testing/live-client.ts";

describe("API Worker", () => {
  test("forwards /live to the canvas", async () => {
    const client = await connectLive(exports.default);

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
});
