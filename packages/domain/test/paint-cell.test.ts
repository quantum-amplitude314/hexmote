import { describe, expect, test } from "bun:test";
import {
  canvasCreated,
  canvasFrozen,
  cellA,
  cellB,
  cellOutside,
  cellPainted,
  notInPalette,
  paintCell,
  red,
  s1,
  s2,
  seconds,
  t,
} from "./fixtures.ts";
import { accepted, given, rejected } from "./given.ts";

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
    const decision = given([canvasCreated, canvasFrozen]).when(
      paintCell({ cell: cellA, color: red }),
    );

    expect(decision).toEqual(rejected({ reason: "canvasFrozen" }));
  });
});
