import { describe, expect, test } from "bun:test";
import { afterPaint, cooldownText, idlePaintStatus, paintStatusText } from "./paint-status";

const now = Date.UTC(2026, 9, 22, 12);
const second = 1000;

describe("afterPaint", () => {
  test("starts the cooldown after a paint", () => {
    const status = afterPaint({
      result: { status: "painted", nextPaintAt: now + 10 * second },
      status: idlePaintStatus,
      now,
    });

    expect(status).toEqual({
      nextPaintAt: now + 10 * second,
      message: "Painted",
      messageUntil: now + 10 * second,
    });
  });

  test("takes the wait from a cooldown rejection", () => {
    const status = afterPaint({
      result: { status: "rejected", rejection: { reason: "cooldown", retryAt: now + 5 * second } },
      status: idlePaintStatus,
      now,
    });

    expect(status).toMatchObject({
      nextPaintAt: now + 5 * second,
      message: "Too soon, wait for the cooldown",
    });
  });

  test("keeps the cooldown and explains any other rejection", () => {
    const status = afterPaint({
      result: { status: "rejected", rejection: { reason: "canvasFrozen" } },
      status: { ...idlePaintStatus, nextPaintAt: now },
      now,
    });

    expect(status).toMatchObject({ nextPaintAt: now, message: "The canvas is frozen" });
  });

  test("shows a message for at least 3 s, even without a cooldown", () => {
    const status = afterPaint({
      result: { status: "painted", nextPaintAt: now + second },
      status: idlePaintStatus,
      now,
    });

    expect(status.messageUntil).toBe(now + 3 * second);
  });
});

describe("paintStatusText", () => {
  const painted = afterPaint({
    result: { status: "painted", nextPaintAt: now + 10 * second },
    status: idlePaintStatus,
    now,
  });

  test("shows the message next to the countdown", () => {
    expect(paintStatusText({ status: painted, now: now + 7.9 * second })).toBe(
      "Next paint in 3 s · Painted",
    );
  });

  test("drops the message once the cooldown is over", () => {
    expect(paintStatusText({ status: painted, now: now + 10 * second })).toBe("Ready to paint");
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
