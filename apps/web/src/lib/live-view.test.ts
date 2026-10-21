import { describe, expect, test } from "bun:test";
import type { Painter, PublicCanvasView } from "@hexmote/contracts";
import { applyLiveUpdate, emptyLiveState, type LiveState } from "./live-view";

const cellA = { axialQ: 0, axialR: 0 };
const cellB = { axialQ: 1, axialR: 0 };
const red = "#e50000";
const blueFox: Painter = { name: "Blue Fox", color: "#0083c7" };
const redOwl: Painter = { name: "Red Owl", color: "#e50000" };

const view: PublicCanvasView = {
  palette: [red],
  cells: [
    { cell: cellA, targetColor: red, color: null },
    { cell: cellB, targetColor: red, color: null },
  ],
  paintedPercent: 0,
  status: "open",
  resetAt: null,
};

const watching: LiveState = {
  ...emptyLiveState,
  view,
  you: blueFox,
  online: [blueFox],
  connected: true,
};

const paintedBy = (painter: Painter) =>
  ({ type: "cellPainted", cell: cellA, color: red, paintedPercent: 50, painter }) as const;

describe("applyLiveMessage", () => {
  test("replaces the view with a snapshot", () => {
    const state = applyLiveUpdate({
      state: emptyLiveState,
      update: { type: "snapshot", view },
    });

    expect(state.view).toEqual(view);
  });

  test("paints the cell and takes the new painted share", () => {
    const state = applyLiveUpdate({ state: watching, update: paintedBy(redOwl) });

    expect(state.view).toEqual({
      ...view,
      cells: [
        { cell: cellA, targetColor: red, color: red },
        { cell: cellB, targetColor: red, color: null },
      ],
      paintedPercent: 50,
    });
  });

  test("changes only the status on a status message", () => {
    const state = applyLiveUpdate({
      state: watching,
      update: { type: "status", status: "frozen", resetAt: null },
    });

    expect(state.view).toEqual({ ...view, status: "frozen" });
  });

  test("takes the time of the new round from a completed status", () => {
    const resetAt = Date.UTC(2026, 9, 22, 18);

    const state = applyLiveUpdate({
      state: watching,
      update: { type: "status", status: "completed", resetAt },
    });

    expect(state.view).toEqual({ ...view, status: "completed", resetAt });
  });

  test("is connected from the first snapshot", () => {
    const state = applyLiveUpdate({ state: emptyLiveState, update: { type: "snapshot", view } });

    expect(state.connected).toBe(true);
  });

  test("shows a dropped connection with nobody online and keeps the last view", () => {
    const state = applyLiveUpdate({ state: watching, update: { type: "disconnected" } });

    expect(state).toEqual({ ...watching, online: [], connected: false });
  });

  test("ignores updates before the first snapshot", () => {
    const state = applyLiveUpdate({
      state: emptyLiveState,
      update: { type: "status", status: "frozen", resetAt: null },
    });

    expect(state.view).toBeNull();
  });

  test("remembers who you are from the welcome", () => {
    const state = applyLiveUpdate({
      state: emptyLiveState,
      update: { type: "welcome", you: blueFox },
    });

    expect(state.you).toEqual(blueFox);
  });

  test("replaces the online list", () => {
    const state = applyLiveUpdate({
      state: watching,
      update: { type: "presence", online: [blueFox, redOwl] },
    });

    expect(state.online).toEqual([blueFox, redOwl]);
  });

  test("keeps other people's paints for the pulse, newest last", () => {
    const once = applyLiveUpdate({ state: watching, update: paintedBy(redOwl) });
    const twice = applyLiveUpdate({ state: once, update: paintedBy(redOwl) });

    expect(twice.recentPaints).toEqual([
      { id: 1, cell: cellA, painter: redOwl },
      { id: 2, cell: cellA, painter: redOwl },
    ]);
  });

  test("does not pulse your own paints", () => {
    const state = applyLiveUpdate({ state: watching, update: paintedBy(blueFox) });

    expect(state.recentPaints).toEqual([]);
  });
});
