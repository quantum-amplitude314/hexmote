import { describe, expect, test } from "bun:test";
import {
  blue,
  canvasCompleted,
  canvasCreated,
  canvasFrozen,
  cellA,
  cellB,
  cellC,
  cellD,
  cellOutside,
  cellPainted,
  notInPalette,
  paintCell,
  red,
  s1,
  s2,
  seconds,
  t,
} from "../../testing/fixtures.ts";
import { accepted, given, rejected } from "../../testing/given.ts";

describe("Slice 2: Paint a cell", () => {
  test("paints a cell on an open canvas", () => {
    const decision = given([canvasCreated]).when(paintCell({ cell: cellA, color: red }));

    expect(decision).toEqual(accepted([cellPainted({ cell: cellA, color: red })]));
  });

  test("rejects painting before the canvas exists", () => {
    const decision = given([]).when(paintCell({ cell: cellA, color: red }));

    expect(decision).toEqual(rejected({ reason: "noCanvas" }));
  });

  test("rejects a cell outside the canvas", () => {
    const decision = given([canvasCreated]).when(paintCell({ cell: cellOutside, color: red }));

    expect(decision).toEqual(rejected({ reason: "cellOutsideCanvas" }));
  });

  test("rejects a colour that is not in the palette", () => {
    const decision = given([canvasCreated]).when(paintCell({ cell: cellA, color: notInPalette }));

    expect(decision).toEqual(rejected({ reason: "colorNotInPalette" }));
  });

  test("rejects a second paint by the same session within the cooldown", () => {
    const history = [canvasCreated, cellPainted({ sessionId: s1, cell: cellA, color: red, at: t })];

    const decision = given(history).when(
      paintCell({ sessionId: s1, cell: cellB, color: red, at: t + seconds(5) }),
    );

    expect(decision).toEqual(rejected({ reason: "cooldown", retryAt: t + seconds(10) }));
  });

  test("accepts a second paint by the same session once the cooldown has passed", () => {
    const history = [canvasCreated, cellPainted({ sessionId: s1, cell: cellA, color: red, at: t })];

    const decision = given(history).when(
      paintCell({ sessionId: s1, cell: cellB, color: red, at: t + seconds(10) }),
    );

    expect(decision).toEqual(
      accepted([cellPainted({ sessionId: s1, cell: cellB, color: red, at: t + seconds(10) })]),
    );
  });

  test("keeps the cooldown per session", () => {
    const history = [canvasCreated, cellPainted({ sessionId: s1, cell: cellA, color: red, at: t })];

    const decision = given(history).when(
      paintCell({ sessionId: s2, cell: cellB, color: red, at: t + seconds(5) }),
    );

    expect(decision).toEqual(
      accepted([cellPainted({ sessionId: s2, cell: cellB, color: red, at: t + seconds(5) })]),
    );
  });

  test("rejects painting on a frozen canvas", () => {
    const decision = given([canvasCreated, canvasFrozen()]).when(
      paintCell({ cell: cellA, color: red }),
    );

    expect(decision).toEqual(rejected({ reason: "canvasFrozen" }));
  });

  describe("completing the canvas", () => {
    const allButD = [
      canvasCreated,
      cellPainted({ cell: cellA, color: red }),
      cellPainted({ cell: cellB, color: blue }),
      cellPainted({ cell: cellC, color: red }),
    ];

    test("completes the canvas with the paint that fills the last blank cell", () => {
      const decision = given(allButD).when(paintCell({ sessionId: s2, cell: cellD, color: red }));

      expect(decision).toEqual(
        accepted([cellPainted({ sessionId: s2, cell: cellD, color: red }), canvasCompleted()]),
      );
    });

    test("keeps painting while a blank cell is left", () => {
      const decision = given(allButD).when(paintCell({ sessionId: s2, cell: cellA, color: blue }));

      expect(decision).toEqual(
        accepted([cellPainted({ sessionId: s2, cell: cellA, color: blue })]),
      );
    });

    test("rejects painting on a completed canvas", () => {
      const history = [
        ...allButD,
        cellPainted({ sessionId: s2, cell: cellD, color: red }),
        canvasCompleted(),
      ];

      const decision = given(history).when(
        paintCell({ cell: cellA, color: blue, at: t + seconds(10) }),
      );

      expect(decision).toEqual(rejected({ reason: "canvasCompleted" }));
    });
  });
});
