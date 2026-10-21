import { describe, expect, test } from "bun:test";
import type { PublicCanvasView } from "@hexmote/contracts";
import { applyLiveMessage } from "./live-view";

const cellA = { axialQ: 0, axialR: 0 };
const cellB = { axialQ: 1, axialR: 0 };
const red = "#e50000";

const view: PublicCanvasView = {
  cells: [
    { cell: cellA, targetColor: red, color: null },
    { cell: cellB, targetColor: red, color: null },
  ],
  completionPercent: 0,
  status: "open",
};

describe("applyLiveMessage", () => {
  test("replaces the view with a snapshot", () => {
    expect(applyLiveMessage({ view: null, message: { type: "snapshot", view } })).toEqual(view);
  });

  test("paints the cell and takes the new completion", () => {
    const painted = applyLiveMessage({
      view,
      message: { type: "cellPainted", cell: cellA, color: red, completionPercent: 50 },
    });

    expect(painted).toEqual({
      ...view,
      cells: [
        { cell: cellA, targetColor: red, color: red },
        { cell: cellB, targetColor: red, color: null },
      ],
      completionPercent: 50,
    });
  });

  test("changes only the status on a status message", () => {
    const frozen = applyLiveMessage({ view, message: { type: "status", status: "frozen" } });

    expect(frozen).toEqual({ ...view, status: "frozen" });
  });

  test("ignores updates before the first snapshot", () => {
    const ignored = applyLiveMessage({
      view: null,
      message: { type: "status", status: "frozen" },
    });

    expect(ignored).toBeNull();
  });
});
