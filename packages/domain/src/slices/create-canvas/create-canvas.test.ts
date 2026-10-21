import { describe, expect, test } from "bun:test";
import { canvasCreated, cellA, createCanvas, notInPalette } from "../../testing/fixtures.ts";
import { accepted, given, rejected } from "../../testing/given.ts";

describe("Slice 1: Create canvas", () => {
  test("creates the canvas", () => {
    const decision = given([]).when(createCanvas);

    expect(decision).toEqual(accepted([canvasCreated]));
  });

  test("rejects a second canvas", () => {
    const decision = given([canvasCreated]).when(createCanvas);

    expect(decision).toEqual(rejected({ reason: "canvasExists" }));
  });

  test("rejects a template colour that is not in the palette", () => {
    const command = { ...createCanvas, template: [{ cell: cellA, color: notInPalette }] };

    const decision = given([]).when(command);

    expect(decision).toEqual(rejected({ reason: "templateColorNotInPalette" }));
  });
});
