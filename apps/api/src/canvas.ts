import { DurableObject } from "cloudflare:workers";
import { handleCommand } from "@hexmote/application";
import type { CanvasCommand } from "@hexmote/domain";
import { createSqliteEventStore } from "./sqlite-event-store.ts";

/** RPC reaches prototype methods only, so handlers are class methods, not arrow-function fields. */
export class Canvas extends DurableObject<Env> {
  private readonly store = createSqliteEventStore(this.ctx.storage);
  private readonly cooldownMs = Number(this.env.COOLDOWN_MS);

  async handleCommand(command: CanvasCommand) {
    const decision = await handleCommand({
      store: this.store,
      command,
      cooldownMs: this.cooldownMs,
    });

    return decision;
  }
}
