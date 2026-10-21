import { describe, expect, test } from "bun:test";
import { nearestColor } from "./nearest-color.ts";

const palette = ["#000000", "#ffffff", "#e50000"];

describe("nearestColor", () => {
  test("returns an exact palette match", () => {
    expect(nearestColor({ rgb: { red: 229, green: 0, blue: 0 }, palette })).toBe("#e50000");
  });

  test("returns the palette colour closest in RGB", () => {
    expect(nearestColor({ rgb: { red: 200, green: 30, blue: 20 }, palette })).toBe("#e50000");
    expect(nearestColor({ rgb: { red: 40, green: 40, blue: 40 }, palette })).toBe("#000000");
  });
});
