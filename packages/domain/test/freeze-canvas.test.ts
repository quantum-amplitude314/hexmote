import { describe, expect, test } from "bun:test";
import { canvasCreated, canvasFrozen, freezeCanvas } from "./fixtures.ts";
import { accepted, given, rejected } from "./given.ts";

describe("Slice 3: Freeze canvas", () => {
  test("freezes an open canvas", () => {
    const decision = given([canvasCreated]).when(freezeCanvas);

    expect(decision).toEqual(accepted([canvasFrozen]));
  });

  test("records nothing when the canvas is already frozen", () => {
    const decision = given([canvasCreated, canvasFrozen]).when(freezeCanvas);

    expect(decision).toEqual(accepted([]));
  });

  test("rejects freezing before the canvas exists", () => {
    const decision = given([]).when(freezeCanvas);

    expect(decision).toEqual(rejected({ reason: "noCanvas" }));
  });
});
