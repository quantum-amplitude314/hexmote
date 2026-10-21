import { describe, expect, test } from "bun:test";
import type { Painter, PublicCanvasView } from "@hexmote/contracts";
import { applyLiveMessage, emptyLiveState, type LiveState } from "./live-view";

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
  completionPercent: 0,
  status: "open",
};

const watching: LiveState = { ...emptyLiveState, view, you: blueFox };

const paintedBy = (painter: Painter) =>
  ({ type: "cellPainted", cell: cellA, color: red, completionPercent: 50, painter }) as const;

describe("applyLiveMessage", () => {
  test("replaces the view with a snapshot", () => {
    const state = applyLiveMessage({
      state: emptyLiveState,
      message: { type: "snapshot", view },
    });

    expect(state.view).toEqual(view);
  });

  test("paints the cell and takes the new completion", () => {
    const state = applyLiveMessage({ state: watching, message: paintedBy(redOwl) });

    expect(state.view).toEqual({
      ...view,
      cells: [
        { cell: cellA, targetColor: red, color: red },
        { cell: cellB, targetColor: red, color: null },
      ],
      completionPercent: 50,
    });
  });

  test("changes only the status on a status message", () => {
    const state = applyLiveMessage({
      state: watching,
      message: { type: "status", status: "frozen" },
    });

    expect(state.view).toEqual({ ...view, status: "frozen" });
  });

  test("ignores updates before the first snapshot", () => {
    const state = applyLiveMessage({
      state: emptyLiveState,
      message: { type: "status", status: "frozen" },
    });

    expect(state.view).toBeNull();
  });

  test("remembers who you are from the welcome", () => {
    const state = applyLiveMessage({
      state: emptyLiveState,
      message: { type: "welcome", you: blueFox },
    });

    expect(state.you).toEqual(blueFox);
  });

  test("replaces the online list", () => {
    const state = applyLiveMessage({
      state: watching,
      message: { type: "presence", online: [blueFox, redOwl] },
    });

    expect(state.online).toEqual([blueFox, redOwl]);
  });

  test("keeps other people's paints for the pulse, newest last", () => {
    const once = applyLiveMessage({ state: watching, message: paintedBy(redOwl) });
    const twice = applyLiveMessage({ state: once, message: paintedBy(redOwl) });

    expect(twice.recentPaints).toEqual([
      { id: 1, cell: cellA, painter: redOwl },
      { id: 2, cell: cellA, painter: redOwl },
    ]);
  });

  test("does not pulse your own paints", () => {
    const state = applyLiveMessage({ state: watching, message: paintedBy(blueFox) });

    expect(state.recentPaints).toEqual([]);
  });
});
