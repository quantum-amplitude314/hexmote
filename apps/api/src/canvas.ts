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
  type BudgetLimits,
  budgetGuard,
  type CanvasCommand,
  type CanvasConfig,
  type CanvasEvent,
  type CanvasView,
  countedRequest,
  emptyUsage,
  evolveCanvasView,
  replayCanvasView,
  type Usage,
  usageAt,
} from "@hexmote/domain";
import { liveMessageFor, snapshotOf } from "./live.ts";
import { painterOf } from "./painter.ts";
import { createSqliteEventStore, deleteSqliteEvents } from "./sqlite-event-store.ts";

const budgetFreezeRefusal: BudgetFreezeRefusal = { status: "refused", reason: "budgetFreeze" };

const resetRetryMs = 60 * 60 * 1000;

export const usageKey = "usage";

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
  #limits: BudgetLimits = {
    perDay: Number(this.env.BUDGET_PER_DAY),
    perCycle: Number(this.env.BUDGET_PER_CYCLE),
    billingCycleDay: Number(this.env.BILLING_CYCLE_DAY),
  };
  #view: CanvasView | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(livePing, livePong));
  }

  async handleCommand(command: CanvasCommand) {
    await this.#countAgainstBudget();

    return this.#handleCommand(command);
  }

  async getView() {
    if (!this.#view) {
      const { events } = await this.#store.read();
      this.#view = replayCanvasView(events);
    }

    return this.#view;
  }

  async getBudget() {
    const { billingCycleDay } = this.#limits;
    const budget = {
      usage: usageAt({ usage: await this.#storedUsage(), at: Date.now(), billingCycleDay }),
      limits: this.#limits,
    };

    return budget;
  }

  async deleteCanvas() {
    await this.#countAgainstBudget();
    if (await this.#isBudgetFrozen()) return budgetFreezeRefusal;
    await this.#wipe();
    const deleted: DeleteResult = { status: "deleted" };

    return deleted;
  }

  async resetCanvas() {
    await this.#countAgainstBudget();

    return this.#reset();
  }

  override async alarm() {
    await this.#countAgainstBudget();
    const result = await this.#reset();
    const waitsForBudget = result.status === "refused" && result.reason === "budgetFreeze";
    if (waitsForBudget) await this.ctx.storage.setAlarm(Date.now() + resetRetryMs);
  }

  override async fetch(request: Request) {
    await this.#countAgainstBudget();
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

  async #handleCommand(command: CanvasCommand) {
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

  async #storedUsage() {
    const usage = (await this.ctx.storage.get<Usage>(usageKey)) ?? emptyUsage;

    return usage;
  }

  async #countAgainstBudget() {
    const at = Date.now();
    const { billingCycleDay } = this.#limits;
    const usage = countedRequest({ usage: await this.#storedUsage(), at, billingCycleDay });
    await this.ctx.storage.put(usageKey, usage);
    const budgetFrozen = await this.#isBudgetFrozen();
    const command = budgetGuard({ usage, limits: this.#limits, budgetFrozen, at });
    if (command) await this.#handleCommand(command);
  }

  async #reset() {
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
    await this.#handleCommand({ type: "CreateCanvas", palette, template, at: Date.now() });
    const reset: ResetResult = { status: "reset" };

    return reset;
  }

  async #isBudgetFrozen() {
    const { freezes } = await this.getView();

    return freezes.includes("budget");
  }

  async #wipe() {
    // Not deleteAll: the usage stays, so a reset or delete never zeroes the budget.
    deleteSqliteEvents(this.ctx.storage);
    await this.ctx.storage.deleteAlarm();
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
