import { describe, expect, test } from "bun:test";
import {
  blue,
  canvasCreated,
  canvasFrozen,
  canvasUnfrozen,
  cellA,
  cellB,
  cellC,
  cellD,
  cellPainted,
  red,
} from "./fixtures.ts";
import { given } from "./given.ts";

describe("Slice 5: Canvas view", () => {
  test("starts with blank cells, 0 % completion and an open canvas", () => {
    const view = given([canvasCreated]).view();

    expect(view).toEqual({
      cells: [
        { cell: cellA, color: null },
        { cell: cellB, color: null },
        { cell: cellC, color: null },
        { cell: cellD, color: null },
      ],
      completionPercent: 0,
      status: "open",
      freezes: [],
    });
  });

  test("counts only cells painted in their target colour", () => {
    const history = [
      canvasCreated,
      cellPainted({ cell: cellA, color: red }),
      cellPainted({ cell: cellC, color: red }),
    ];

    const view = given(history).view();

    expect(view.cells).toEqual([
      { cell: cellA, color: red },
      { cell: cellB, color: null },
      { cell: cellC, color: red },
      { cell: cellD, color: null },
    ]);
    expect(view.completionPercent).toBe(25);
  });

  test("shows the last paint of a cell", () => {
    const history = [
      canvasCreated,
      cellPainted({ cell: cellA, color: red }),
      cellPainted({ cell: cellA, color: blue }),
    ];

    const view = given(history).view();

    expect(view.cells[0]).toEqual({ cell: cellA, color: blue });
    expect(view.completionPercent).toBe(0);
  });

  test("shows a frozen canvas", () => {
    const view = given([canvasCreated, canvasFrozen()]).view();

    expect(view.status).toBe("frozen");
  });

  test("shows an unfrozen canvas as open", () => {
    const view = given([canvasCreated, canvasFrozen(), canvasUnfrozen()]).view();

    expect(view.status).toBe("open");
  });

  test("stays frozen while another freeze is active", () => {
    const history = [
      canvasCreated,
      canvasFrozen({ reason: "budget" }),
      canvasFrozen({ reason: "manual" }),
      canvasUnfrozen({ reason: "budget" }),
    ];

    const view = given(history).view();

    expect(view.status).toBe("frozen");
    expect(view.freezes).toEqual(["manual"]);
  });
});
