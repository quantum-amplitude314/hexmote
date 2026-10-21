import { DurableObject } from "cloudflare:workers";
import { handleCommand } from "@hexmote/application";
import {
  type BudgetFreezeRefusal,
  type DeleteResult,
  type LiveMessage,
  livePing,
  livePong,
  type ResetResult,
} from "@hexmote/contracts";
import {
  type CanvasCommand,
  type CanvasConfig,
  type CanvasEvent,
  type CanvasView,
  evolveCanvasView,
  replayCanvasView,
} from "@hexmote/domain";
import { liveMessageFor, snapshotOf } from "./live.ts";
import { painterOf } from "./painter.ts";
import { createSqliteEventStore } from "./sqlite-event-store.ts";

const budgetFreezeRefusal: BudgetFreezeRefusal = { status: "refused", reason: "budgetFreeze" };

const resetRetryMs = 60 * 60 * 1000;

/** Set by the API Worker from the session cookie, never taken from the browser. */
export const sessionHeader = "X-Hexmote-Session";

type ViewerAttachment = { sessionId: string };

/** RPC reaches public prototype methods only; `#` members stay out of it. */
export class Canvas extends DurableObject<Env> {
  #store = createSqliteEventStore(this.ctx.storage);
  #config: CanvasConfig = {
    cooldownMs: Number(this.env.COOLDOWN_MS),
    resetAfterMs: Number(this.env.RESET_AFTER_MS),
  };
  #view: CanvasView | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(livePing, livePong));
  }

  async handleCommand(command: CanvasCommand) {
    const decision = await handleCommand({
      store: this.#store,
      command,
      config: this.#config,
    });
    if (decision.status === "accepted" && decision.events.length > 0) {
      const view = await this.#viewAfter(decision.events);
      for (const event of decision.events) {
        this.#broadcast({ message: liveMessageFor({ event, view }) });
        if (event.type === "CanvasCompleted") await this.ctx.storage.setAlarm(event.resetAt);
      }
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

  async deleteCanvas() {
    if (await this.#isBudgetFrozen()) return budgetFreezeRefusal;
    await this.#wipe();
    const deleted: DeleteResult = { status: "deleted" };

    return deleted;
  }

  async resetCanvas() {
    const {
      events: [created],
    } = await this.#store.read();
    if (created?.type !== "CanvasCreated") {
      const refused: ResetResult = { status: "refused", reason: "noCanvas" };

      return refused;
    }
    if (await this.#isBudgetFrozen()) return budgetFreezeRefusal;
    await this.#wipe();
    const { palette, template } = created;
    await this.handleCommand({ type: "CreateCanvas", palette, template, at: Date.now() });
    const reset: ResetResult = { status: "reset" };

    return reset;
  }

  override async alarm() {
    const result = await this.resetCanvas();
    const waitsForBudget = result.status === "refused" && result.reason === "budgetFreeze";
    if (waitsForBudget) await this.ctx.storage.setAlarm(Date.now() + resetRetryMs);
  }

  override async fetch(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }
    const sessionId = request.headers.get(sessionHeader) ?? crypto.randomUUID();
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ sessionId } satisfies ViewerAttachment);
    server.send(JSON.stringify(snapshotOf(await this.getView())));
    this.#send({ socket: server, message: { type: "welcome", you: painterOf(sessionId) } });
    this.#broadcastPresence();
    const upgraded = new Response(null, { status: 101, webSocket: client });

    return upgraded;
  }

  override webSocketClose(socket: WebSocket) {
    this.#broadcastPresence(socket);
  }

  override webSocketError(socket: WebSocket) {
    this.#broadcastPresence(socket);
  }

  async #isBudgetFrozen() {
    const { freezes } = await this.getView();

    return freezes.includes("budget");
  }

  async #wipe() {
    // deleteAll also drops the alarm and the events table; the new store creates the table again.
    await this.ctx.storage.deleteAll();
    this.#store = createSqliteEventStore(this.ctx.storage);
    this.#view = null;
  }

  async #viewAfter(events: CanvasEvent[]) {
    // Without a cached view, the replay already includes the appended events.
    const view = this.#view
      ? events.reduce((current, event) => evolveCanvasView({ view: current, event }), this.#view)
      : await this.getView();
    this.#view = view;

    return view;
  }

  #openSockets(leaving?: WebSocket) {
    const open = this.ctx
      .getWebSockets()
      .filter((socket) => socket !== leaving && socket.readyState === WebSocket.OPEN);

    return open;
  }

  #send({ socket, message }: { socket: WebSocket; message: LiveMessage }) {
    socket.send(JSON.stringify(message));
  }

  #broadcast({ message, leaving }: { message: LiveMessage; leaving?: WebSocket | undefined }) {
    for (const socket of this.#openSockets(leaving)) this.#send({ socket, message });
  }

  #broadcastPresence(leaving?: WebSocket) {
    const sessionIds = new Set(
      this.#openSockets(leaving).map(
        (socket) => (socket.deserializeAttachment() as ViewerAttachment).sessionId,
      ),
    );
    const online = [...sessionIds]
      .map(painterOf)
      .sort((first, second) => first.name.localeCompare(second.name));
    this.#broadcast({ message: { type: "presence", online }, leaving });
  }
}
