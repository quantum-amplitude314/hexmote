import { describe, expect, test } from "bun:test";
import { progressLabel } from "./progress-label";

const now = Date.UTC(2026, 9, 22, 12);
const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;

const completedLabel = (resetAt: number) => progressLabel({ status: "completed", resetAt, now });

describe("progressLabel", () => {
  test("names the painted share of an open canvas", () => {
    expect(progressLabel({ status: "open", resetAt: null, now })).toBe("Painted");
  });

  test("marks a frozen canvas", () => {
    expect(progressLabel({ status: "frozen", resetAt: now + hour, now })).toBe("Painted · frozen");
  });

  test("counts down to the new round in hours and minutes", () => {
    const label = completedLabel(now + 5 * hour + 59 * minute + 30 * second);

    expect(label).toBe("Complete · new round in 5 h 59 min");
  });

  test("counts down the last hour in minutes", () => {
    expect(completedLabel(now + 12 * minute + 30 * second)).toBe("Complete · new round in 12 min");
  });

  test("counts down the last minute in seconds", () => {
    expect(completedLabel(now + 41.2 * second)).toBe("Complete · new round in 42 s");
  });

  test("says the new round is starting once its time has come", () => {
    expect(completedLabel(now - second)).toBe("Complete · new round starting");
  });
});
