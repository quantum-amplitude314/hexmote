import { describe, expect, test } from "bun:test";
import {
  canvasCreated,
  canvasFrozen,
  canvasUnfrozen,
  cellA,
  paintCell,
  red,
  unfreezeCanvas,
} from "../../testing/fixtures.ts";
import { accepted, given, rejected } from "../../testing/given.ts";

describe("Slice 4: Unfreeze canvas", () => {
  test("unfreezes a canvas frozen for that reason", () => {
    const decision = given([canvasCreated, canvasFrozen()]).when(unfreezeCanvas());

    expect(decision).toEqual(accepted([canvasUnfrozen()]));
  });

  test("records nothing when the canvas is open", () => {
    const decision = given([canvasCreated]).when(unfreezeCanvas());

    expect(decision).toEqual(accepted([]));
  });

  test("records nothing when that reason is not active", () => {
    const history = [canvasCreated, canvasFrozen({ reason: "budget" })];

    const decision = given(history).when(unfreezeCanvas({ reason: "manual" }));

    expect(decision).toEqual(accepted([]));
  });

  test("keeps the canvas frozen while another freeze is active", () => {
    const history = [
      canvasCreated,
      canvasFrozen({ reason: "budget" }),
      canvasFrozen({ reason: "manual" }),
      canvasUnfrozen({ reason: "budget" }),
    ];

    const decision = given(history).when(paintCell({ cell: cellA, color: red }));

    expect(decision).toEqual(rejected({ reason: "canvasFrozen" }));
  });

  test("rejects unfreezing before the canvas exists", () => {
    const decision = given([]).when(unfreezeCanvas());

    expect(decision).toEqual(rejected({ reason: "noCanvas" }));
  });
});
