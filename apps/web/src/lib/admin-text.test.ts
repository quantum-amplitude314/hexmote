import { describe, expect, test } from "bun:test";
import type { AdminCanvasStatus } from "@hexmote/contracts";
import { canvasFrozen } from "@hexmote/domain/testing";
import { adminBudgetText, adminResultText, adminStatusText } from "./admin-text";

const now = Date.UTC(2026, 9, 22, 12);
const minute = 60 * 1000;

const openCanvas: AdminCanvasStatus = {
  exists: true,
  status: "open",
  paintedPercent: 12.3,
  freezes: [],
  resetAt: null,
  budget: { dayCount: 12, perDay: 1000, cycleCount: 340, perCycle: 5000 },
};

describe("adminStatusText", () => {
  test("says there is no canvas yet", () => {
    const status = { ...openCanvas, exists: false, paintedPercent: 0 };

    expect(adminStatusText({ status, now })).toBe("No canvas yet");
  });

  test("shows the painted share of an open canvas", () => {
    expect(adminStatusText({ status: openCanvas, now })).toBe("Open · 12.3% painted");
  });

  test("names every freeze, the budget guard included", () => {
    const status: AdminCanvasStatus = {
      ...openCanvas,
      status: "frozen",
      freezes: ["budget", "manual"],
    };

    expect(adminStatusText({ status, now })).toBe(
      "Frozen by the budget guard and by you · 12.3% painted",
    );
  });

  test("counts down to the new round of a complete canvas", () => {
    const status: AdminCanvasStatus = {
      ...openCanvas,
      status: "completed",
      paintedPercent: 100,
      resetAt: now + 12 * minute,
    };

    expect(adminStatusText({ status, now })).toBe("Complete · new round in 12 min");
  });
});

describe("adminBudgetText", () => {
  test("shows the requests counted against both limits", () => {
    expect(adminBudgetText(openCanvas.budget)).toBe(
      "Requests today 12 / 1000 · this cycle 340 / 5000",
    );
  });
});

describe("adminResultText", () => {
  test("confirms an accepted command", () => {
    const outcome = { status: "accepted" as const, events: [canvasFrozen()] };

    expect(adminResultText({ command: "freeze", outcome })).toBe("Frozen");
  });

  test("says when an accepted command changed nothing", () => {
    const outcome = { status: "accepted" as const, events: [] };

    expect(adminResultText({ command: "unfreeze", outcome })).toBe("Nothing changed");
  });

  test("confirms a reset and a delete", () => {
    expect(adminResultText({ command: "reset", outcome: { status: "reset" } })).toBe(
      "A new round started",
    );
    expect(adminResultText({ command: "delete", outcome: { status: "deleted" } })).toBe("Deleted");
  });

  test("explains a rejection", () => {
    const outcome = { status: "rejected" as const, rejection: { reason: "canvasExists" as const } };

    expect(adminResultText({ command: "create", outcome })).toBe(
      "Rejected: the canvas already exists",
    );
  });

  test("explains that only the budget guard lifts its freeze", () => {
    const outcome = { status: "refused" as const, reason: "budgetFreeze" as const };

    expect(adminResultText({ command: "delete", outcome })).toBe(
      "Refused: the budget freeze is on, and only the budget guard lifts it",
    );
  });

  test("reports a failed request", () => {
    expect(
      adminResultText({ command: "freeze", outcome: { status: "failed", httpStatus: 403 } }),
    ).toBe("Failed: HTTP 403");
    expect(
      adminResultText({ command: "freeze", outcome: { status: "failed", httpStatus: null } }),
    ).toBe("Failed: no response");
  });
});
