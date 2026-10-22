import { type LiveMessage, livePing, livePong } from "@hexmote/contracts";

type OpenLiveConnection = (input: {
  url: string;
  onMessage: (message: LiveMessage) => void;
  onDisconnect: () => void;
  onRefused: () => void;
}) => { close: () => void };

const firstReconnectDelayMs = 1000;
const maxReconnectDelayMs = 30_000;
const pingEveryMs = 25_000;

export const reconnectDelayMs = (attempt: number) =>
  Math.min(firstReconnectDelayMs * 2 ** attempt, maxReconnectDelayMs);

/** A missed pong counts as a drop: a dead network may never close the socket. */
export const openLiveConnection: OpenLiveConnection = ({
  url,
  onMessage,
  onDisconnect,
  onRefused,
}) => {
  let socket: WebSocket | null = null;
  let failedAttempts = 0;
  let awaitingPong = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  const dropped = ({ lost, opened }: { lost: WebSocket; opened: boolean }) => {
    if (lost !== socket) return;
    socket = null;
    onDisconnect();
    if (!opened) onRefused();
    reconnectTimer = setTimeout(connect, reconnectDelayMs(failedAttempts));
    failedAttempts += 1;
  };

  const connect = () => {
    const current = new WebSocket(url);
    socket = current;
    awaitingPong = false;
    let opened = false;
    current.addEventListener("open", () => {
      opened = true;
      failedAttempts = 0;
    });
    current.addEventListener("message", ({ data }) => {
      if (data === livePong) awaitingPong = false;
      else onMessage(JSON.parse(String(data)));
    });
    current.addEventListener("close", () => dropped({ lost: current, opened }));
  };

  const pingTimer = setInterval(() => {
    const current = socket;
    if (current?.readyState !== WebSocket.OPEN) return;
    if (awaitingPong) {
      dropped({ lost: current, opened: true });
      current.close();

      return;
    }
    awaitingPong = true;
    current.send(livePing);
  }, pingEveryMs);

  connect();
  const connection = {
    close: () => {
      clearInterval(pingTimer);
      clearTimeout(reconnectTimer);
      const current = socket;
      socket = null;
      current?.close();
    },
  };

  return connection;
};
