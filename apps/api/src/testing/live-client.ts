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

  const received: string[] = [];
  const waiting: ((data: string) => void)[] = [];
  webSocket.addEventListener("message", ({ data }) => {
    const text = String(data);
    const resolve = waiting.shift();
    if (resolve) resolve(text);
    else received.push(text);
  });
  webSocket.accept();

  const nextText = () => {
    const queued = received.shift();
    const next =
      queued === undefined
        ? new Promise<string>((resolve) => waiting.push(resolve))
        : Promise.resolve(queued);

    return next;
  };

  const nextMessage = async () => {
    const message = JSON.parse(await nextText()) as LiveMessage;

    return message;
  };

  const nextMessageOf = async <Type extends LiveMessage["type"]>(type: Type) => {
    let message = await nextMessage();
    while (message.type !== type) message = await nextMessage();
    const matching = message as LiveMessageOf<Type>;

    return matching;
  };

  const client = {
    response,
    nextText,
    nextMessage,
    nextMessageOf,
    send: (text: string) => webSocket.send(text),
    close: () => webSocket.close(1000, "test done"),
  };

  return client;
};
