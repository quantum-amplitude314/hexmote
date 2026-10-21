import { DurableObject } from "cloudflare:workers";
import type { CanvasCommand, Decision } from "@hexmote/domain";
import { notImplemented } from "./not-implemented.ts";

/** One canvas = one Durable Object = one event stream. RPC methods live on the prototype. */
export class Canvas extends DurableObject<Env> {
  async handleCommand(_command: CanvasCommand): Promise<Decision> {
    return notImplemented();
  }
}
