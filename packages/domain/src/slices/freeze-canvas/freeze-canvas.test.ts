import { describe, expect, test } from "bun:test";
import { canvasCreated, canvasFrozen, freezeCanvas } from "../../testing/fixtures.ts";
import { accepted, given, rejected } from "../../testing/given.ts";

describe("Slice 3: Freeze canvas", () => {
  test("freezes an open canvas", () => {
    const decision = given([canvasCreated]).when(freezeCanvas());

    expect(decision).toEqual(accepted([canvasFrozen()]));
  });

  test("records nothing when the canvas is already frozen for the same reason", () => {
    const decision = given([canvasCreated, canvasFrozen()]).when(freezeCanvas());

    expect(decision).toEqual(accepted([]));
  });

  test("freezes again for a different reason", () => {
    const history = [canvasCreated, canvasFrozen({ reason: "budget" })];

    const decision = given(history).when(freezeCanvas({ reason: "manual" }));

    expect(decision).toEqual(accepted([canvasFrozen({ reason: "manual" })]));
  });

  test("rejects freezing before the canvas exists", () => {
    const decision = given([]).when(freezeCanvas());

    expect(decision).toEqual(rejected({ reason: "noCanvas" }));
  });
});
