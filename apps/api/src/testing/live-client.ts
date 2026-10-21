import type { LiveMessage } from "../live.ts";

type FetchTarget = { fetch: (input: string, init?: RequestInit) => Promise<Response> };

export const connectLive = async (target: FetchTarget) => {
  const response = await target.fetch("http://hexmote/live", { headers: { Upgrade: "websocket" } });
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

  const client = {
    nextMessage: () => {
      const queued = received.shift();
      const next = queued
        ? Promise.resolve(queued)
        : new Promise<LiveMessage>((resolve) => waiting.push(resolve));

      return next;
    },
    close: () => webSocket.close(1000, "test done"),
  };

  return client;
};
