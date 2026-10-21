import type { LiveMessage, PaintResult, PublicCanvasView } from "@hexmote/contracts";
import type { CanvasViewCell } from "@hexmote/domain";

/** Paints all blank cells but a few in their emote colour through the local API. */
const apiUrl = "http://localhost:8787";
const cellsLeftBlank = 3;
const paintsAtOnce = 8;

const currentView = () =>
  new Promise<PublicCanvasView>((resolve, reject) => {
    const socket = new WebSocket(`${apiUrl.replace("http", "ws")}/live`);
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(String(data)) as LiveMessage;
      if (message.type !== "snapshot") return;
      socket.close();
      resolve(message.view);
    });
    socket.addEventListener("error", () => reject(new Error(`No API at ${apiUrl}: bun run dev`)));
  });

// Without a cookie the API issues a new session per request, so the cooldown never applies.
const paint = async ({ cell, targetColor }: CanvasViewCell) => {
  const response = await fetch(`${apiUrl}/api/paint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cell, color: targetColor }),
  });
  const result = (await response.json()) as PaintResult;

  return result;
};

const { cells } = await currentView();
const blankCells = cells.filter(({ color }) => color === null);
const cellsToPaint = blankCells.slice(0, Math.max(0, blankCells.length - cellsLeftBlank));
for (let start = 0; start < cellsToPaint.length; start += paintsAtOnce) {
  const results = await Promise.all(cellsToPaint.slice(start, start + paintsAtOnce).map(paint));
  const [rejection] = results.flatMap((result) =>
    result.status === "rejected" ? [result.rejection] : [],
  );
  if (rejection) throw new Error(`The canvas refused a paint: ${rejection.reason}`);
}
console.log(
  `Painted ${cellsToPaint.length} cells, ${blankCells.length - cellsToPaint.length} left`,
);
