import { describe, expect, test } from "bun:test";
import { canvasCreated, canvasFrozen, canvasUnfrozen, unfreezeCanvas } from "./fixtures.ts";
import { accepted, given, rejected } from "./given.ts";

describe("Slice 4: Unfreeze canvas", () => {
  test("unfreezes a frozen canvas", () => {
    const decision = given([canvasCreated, canvasFrozen]).when(unfreezeCanvas);

    expect(decision).toEqual(accepted([canvasUnfrozen]));
  });

  test("records nothing when the canvas is already open", () => {
    const decision = given([canvasCreated]).when(unfreezeCanvas);

    expect(decision).toEqual(accepted([]));
  });

  test("rejects unfreezing before the canvas exists", () => {
    const decision = given([]).when(unfreezeCanvas);

    expect(decision).toEqual(rejected({ reason: "noCanvas" }));
  });
});
