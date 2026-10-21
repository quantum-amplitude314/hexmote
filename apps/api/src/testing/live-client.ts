import type { LiveMessage } from "@hexmote/contracts";
import { sessionHeader } from "../canvas.ts";

type FetchTarget = { fetch: (input: string, init?: RequestInit) => Promise<Response> };

type LiveMessageOf<Type extends LiveMessage["type"]> = Extract<LiveMessage, { type: Type }>;

export const connectLive = async ({
  target,
  sessionId,
  cookie,
}: {
  target: FetchTarget;
  sessionId?: string;
  cookie?: string;
}) => {
  const headers: Record<string, string> = { Upgrade: "websocket" };
  if (sessionId) headers[sessionHeader] = sessionId;
  if (cookie) headers.Cookie = cookie;
  const response = await target.fetch("http://hexmote/live", { headers });
  const { webSocket } = response;
  if (!webSocket) throw new Error(`Expected a WebSocket, got status ${response.status}`);

  const received: LiveMessage[] = [];
  const waiting: ((message: LiveMessage) => void)[] = [];
  webSocket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data)) as LiveMessage;
    const resolve = waiting.shift();
    if (resolve) resolve(message);
    else received.push(message);
  });
  webSocket.accept();

  const nextMessage = () => {
    const queued = received.shift();
    const next = queued
      ? Promise.resolve(queued)
      : new Promise<LiveMessage>((resolve) => waiting.push(resolve));

    return next;
  };

  /** Skips other messages, such as presence updates from other viewers joining. */
  const nextMessageOf = async <Type extends LiveMessage["type"]>(type: Type) => {
    let message = await nextMessage();
    while (message.type !== type) message = await nextMessage();
    const matching = message as LiveMessageOf<Type>;

    return matching;
  };

  const client = {
    response,
    nextMessage,
    nextMessageOf,
    close: () => webSocket.close(1000, "test done"),
  };

  return client;
};
