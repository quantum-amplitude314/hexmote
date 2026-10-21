import type { LiveMessage, PaintResult, PublicCanvasView } from "@hexmote/contracts";
import type { CanvasViewCell } from "@hexmote/domain";

/** Paints all blank cells but a few in their emote colour through the local API. */
const apiUrl = "http://localhost:8787";
const cellsLeftBlank = 3;
const sessionCount = 32;
// The only token Cloudflare's test secret in `.dev.vars` accepts.
const dummyTurnstileToken = "XXXX.DUMMY.TOKEN.XXXX";

// Bun's WebSocket takes headers; the Workers types this package uses do not know that.
const BunWebSocket = WebSocket as unknown as new (
  url: string,
  options: { headers: Record<string, string> },
) => WebSocket;

const startSession = async () => {
  const response = await fetch(`${apiUrl}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ turnstileToken: dummyTurnstileToken }),
  });
  const [cookie = ""] = (response.headers.get("Set-Cookie") ?? "").split(";");
  if (!cookie) throw new Error(`No session from ${apiUrl}: ${response.status}`);

  return cookie;
};

const currentView = (cookie: string) =>
  new Promise<PublicCanvasView>((resolve, reject) => {
    const socket = new BunWebSocket(`${apiUrl.replace("http", "ws")}/live`, {
      headers: { Cookie: cookie },
    });
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(String(data)) as LiveMessage;
      if (message.type !== "snapshot") return;
      socket.close();
      resolve(message.view);
    });
    socket.addEventListener("error", () => reject(new Error(`No live view at ${apiUrl}`)));
  });

const paint = async ({ viewCell, cookie }: { viewCell: CanvasViewCell; cookie: string }) => {
  const { cell, targetColor } = viewCell;
  const response = await fetch(`${apiUrl}/api/paint`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ cell, color: targetColor }),
  });
  const result = (await response.json()) as PaintResult;

  return result;
};

const waitUntil = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, Math.max(0, time - Date.now())));

const cookies = await Promise.all(Array.from({ length: sessionCount }, startSession));
const { cells } = await currentView(cookies[0] ?? "");
const blankCells = cells.filter(({ color }) => color === null);
const cellsToPaint = blankCells.slice(0, Math.max(0, blankCells.length - cellsLeftBlank));
// Each session paints once per round, so a round waits for the cooldown.
for (let start = 0; start < cellsToPaint.length; start += sessionCount) {
  const round = cellsToPaint.slice(start, start + sessionCount);
  const results = await Promise.all(
    round.map((viewCell, index) => paint({ viewCell, cookie: cookies[index] ?? "" })),
  );
  const [rejection] = results.flatMap((result) =>
    result.status === "rejected" ? [result.rejection] : [],
  );
  if (rejection) throw new Error(`The canvas refused a paint: ${rejection.reason}`);
  await waitUntil(
    Math.max(...results.map((result) => (result.status === "painted" ? result.nextPaintAt : 0))),
  );
}
console.log(
  `Painted ${cellsToPaint.length} cells, ${blankCells.length - cellsToPaint.length} left`,
);
