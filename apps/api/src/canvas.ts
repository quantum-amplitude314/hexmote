import { DurableObject } from "cloudflare:workers";
import { handleCommand } from "@hexmote/application";
import {
  type CanvasCommand,
  type CanvasEvent,
  type CanvasView,
  evolveCanvasView,
  replayCanvasView,
} from "@hexmote/domain";
import { type LiveMessage, liveMessageFor, snapshotOf } from "./live.ts";
import { createSqliteEventStore } from "./sqlite-event-store.ts";

/** RPC reaches public prototype methods only; `#` members stay out of it. */
export class Canvas extends DurableObject<Env> {
  #store = createSqliteEventStore(this.ctx.storage);
  #cooldownMs = Number(this.env.COOLDOWN_MS);
  #view: CanvasView | null = null;

  async handleCommand(command: CanvasCommand) {
    const decision = await handleCommand({
      store: this.#store,
      command,
      cooldownMs: this.#cooldownMs,
    });
    if (decision.status === "accepted" && decision.events.length > 0) {
      const view = await this.#viewAfter(decision.events);
      for (const event of decision.events) this.#broadcast(liveMessageFor({ event, view }));
    }

    return decision;
  }

  async getView() {
    if (!this.#view) {
      const { events } = await this.#store.read();
      this.#view = replayCanvasView(events);
    }

    return this.#view;
  }

  override async fetch(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.send(JSON.stringify(snapshotOf(await this.getView())));
    const upgraded = new Response(null, { status: 101, webSocket: client });

    return upgraded;
  }

  async #viewAfter(events: CanvasEvent[]) {
    // Without a cached view, the replay already includes the appended events.
    const view = this.#view
      ? events.reduce((current, event) => evolveCanvasView({ view: current, event }), this.#view)
      : await this.getView();
    this.#view = view;

    return view;
  }

  #broadcast(message: LiveMessage) {
    const data = JSON.stringify(message);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
    }
  }
}
