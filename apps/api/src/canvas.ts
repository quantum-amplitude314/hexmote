import { DurableObject } from "cloudflare:workers";
import { handleCommand } from "@hexmote/application";
import {
  type CanvasCommand,
  type CanvasView,
  evolveCanvasView,
  replayCanvasView,
} from "@hexmote/domain";
import { createSqliteEventStore } from "./sqlite-event-store.ts";

/** RPC reaches prototype methods only, so handlers are class methods, not arrow-function fields. */
export class Canvas extends DurableObject<Env> {
  private readonly store = createSqliteEventStore(this.ctx.storage);
  private readonly cooldownMs = Number(this.env.COOLDOWN_MS);
  /** Read model; `null` until the first read replays the stream. */
  private view: CanvasView | null = null;

  async handleCommand(command: CanvasCommand) {
    const decision = await handleCommand({
      store: this.store,
      command,
      cooldownMs: this.cooldownMs,
    });
    if (decision.status === "accepted" && this.view) {
      this.view = decision.events.reduce(
        (view, event) => evolveCanvasView({ view, event }),
        this.view,
      );
    }

    return decision;
  }

  async getView() {
    if (!this.view) {
      const { events } = await this.store.read();
      this.view = replayCanvasView(events);
    }

    return this.view;
  }
}
