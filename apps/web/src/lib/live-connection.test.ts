import { afterEach, beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { livePing, livePong } from "@hexmote/contracts";
import { openLiveConnection, reconnectDelayMs } from "./live-connection";

class FakeSocket extends EventTarget {
  static readonly OPEN = 1;
  static created: FakeSocket[] = [];
  readyState = 0;
  sent: string[] = [];

  constructor(readonly url: string) {
    super();
    FakeSocket.created.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.drop();
  }

  open() {
    this.readyState = FakeSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  receive(data: string) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }

  drop() {
    this.readyState = 3;
    this.dispatchEvent(new Event("close"));
  }
}

const url = "ws://hexmote/live";
const second = 1000;
const realWebSocket = globalThis.WebSocket;

const openConnection = () => {
  const onMessage = mock();
  const onDisconnect = mock();
  const onRefused = mock();
  const connection = openLiveConnection({ url, onMessage, onDisconnect, onRefused });
  const opened = { connection, onMessage, onDisconnect, onRefused };

  return opened;
};

const socketAt = (index: number) => {
  const socket = FakeSocket.created[index];
  if (!socket) throw new Error(`No socket ${index}`);

  return socket;
};

beforeEach(() => {
  FakeSocket.created = [];
  globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  globalThis.WebSocket = realWebSocket;
});

describe("reconnectDelayMs", () => {
  test("waits a second, doubles with each attempt, and stops at 30 s", () => {
    expect([0, 1, 2, 5, 10].map(reconnectDelayMs)).toEqual(
      [1, 2, 4, 30, 30].map((s) => s * second),
    );
  });
});

describe("openLiveConnection", () => {
  test("passes the server's messages on", () => {
    const { onMessage } = openConnection();
    socketAt(0).open();

    socketAt(0).receive(JSON.stringify({ type: "presence", online: [] }));

    expect(onMessage).toHaveBeenCalledWith({ type: "presence", online: [] });
  });

  test("reports a dropped connection and reconnects a second later", () => {
    const { onDisconnect } = openConnection();
    socketAt(0).open();

    socketAt(0).drop();
    jest.advanceTimersByTime(second - 1);
    const beforeDelay = FakeSocket.created.length;
    jest.advanceTimersByTime(1);

    expect(onDisconnect).toHaveBeenCalledTimes(1);
    expect(beforeDelay).toBe(1);
    expect(FakeSocket.created.length).toBe(2);
  });

  test("waits longer after each failed attempt and starts over once connected", () => {
    openConnection();
    socketAt(0).drop();
    jest.advanceTimersByTime(second);
    socketAt(1).drop();
    jest.advanceTimersByTime(2 * second);
    socketAt(2).open();

    socketAt(2).drop();
    jest.advanceTimersByTime(second);

    expect(FakeSocket.created.length).toBe(4);
  });

  test("keeps a connection that answers its pings", () => {
    openConnection();
    socketAt(0).open();

    jest.advanceTimersByTime(25 * second);
    socketAt(0).receive(livePong);
    jest.advanceTimersByTime(25 * second);

    expect(socketAt(0).sent).toEqual([livePing, livePing]);
    expect(FakeSocket.created.length).toBe(1);
  });

  test("drops a connection that misses a pong and reconnects", () => {
    const { onDisconnect, onMessage } = openConnection();
    socketAt(0).open();

    jest.advanceTimersByTime(50 * second);
    jest.advanceTimersByTime(second);

    expect(onDisconnect).toHaveBeenCalledTimes(1);
    expect(socketAt(0).readyState).toBe(3);
    expect(FakeSocket.created.length).toBe(2);
    expect(onMessage).not.toHaveBeenCalled();
  });

  test("stops for good when closed", () => {
    const { connection, onDisconnect } = openConnection();
    socketAt(0).open();

    connection.close();
    jest.advanceTimersByTime(60 * second);

    expect(socketAt(0).readyState).toBe(3);
    expect(onDisconnect).not.toHaveBeenCalled();
    expect(FakeSocket.created.length).toBe(1);
  });
});
