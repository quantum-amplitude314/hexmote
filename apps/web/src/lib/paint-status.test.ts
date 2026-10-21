import { describe, expect, test } from "bun:test";
import { afterPaint, cooldownText } from "./paint-status";

const now = Date.UTC(2026, 9, 22, 12);

describe("afterPaint", () => {
  test("starts the cooldown after a paint", () => {
    const status = afterPaint({
      result: { status: "painted", nextPaintAt: now + 1000 },
      nextPaintAt: null,
    });

    expect(status).toEqual({ nextPaintAt: now + 1000, message: "Painted" });
  });

  test("takes the wait from a cooldown rejection", () => {
    const status = afterPaint({
      result: { status: "rejected", rejection: { reason: "cooldown", retryAt: now + 500 } },
      nextPaintAt: null,
    });

    expect(status).toEqual({ nextPaintAt: now + 500, message: "Too soon, wait for the cooldown" });
  });

  test("keeps the cooldown and explains any other rejection", () => {
    const status = afterPaint({
      result: { status: "rejected", rejection: { reason: "canvasFrozen" } },
      nextPaintAt: now,
    });

    expect(status).toEqual({ nextPaintAt: now, message: "The canvas is frozen" });
  });
});

describe("cooldownText", () => {
  test("says ready when there is no cooldown", () => {
    expect(cooldownText({ nextPaintAt: null, now })).toBe("Ready to paint");
    expect(cooldownText({ nextPaintAt: now, now })).toBe("Ready to paint");
  });

  test("counts down in whole seconds, rounded up", () => {
    expect(cooldownText({ nextPaintAt: now + 2100, now })).toBe("Next paint in 3 s");
  });
});
