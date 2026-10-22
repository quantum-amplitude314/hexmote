import { describe, expect, test } from "bun:test";
import type { BudgetLimits, Usage } from "../../index.ts";
import { budgetGuard, countedRequest, emptyUsage, usageAt } from "./budget-guard.ts";

const limits: BudgetLimits = { perDay: 100, perCycle: 1000, billingCycleDay: 5 };
const { billingCycleDay } = limits;
const at = Date.UTC(2026, 9, 21, 12);

const usage = ({ dayCount = 0, cycleCount = 0 }: { dayCount?: number; cycleCount?: number }) => {
  const current: Usage = { day: "2026-10-21", dayCount, cycleStart: "2026-10-05", cycleCount };

  return current;
};

describe("Slice 6: Budget guard", () => {
  describe("usage", () => {
    test("counts a request in the current UTC day and billing cycle", () => {
      expect(countedRequest({ usage: emptyUsage, at, billingCycleDay })).toEqual(
        usage({ dayCount: 1, cycleCount: 1 }),
      );
    });

    test("starts a new day count each UTC day, the cycle count goes on", () => {
      const nextDay = Date.UTC(2026, 9, 22, 0, 0, 1);

      expect(
        countedRequest({
          usage: usage({ dayCount: 7, cycleCount: 40 }),
          at: nextDay,
          billingCycleDay,
        }),
      ).toEqual({ day: "2026-10-22", dayCount: 1, cycleStart: "2026-10-05", cycleCount: 41 });
    });

    test("starts a new cycle count on the billing cycle day", () => {
      const cycleDay = Date.UTC(2026, 10, 5);

      expect(
        usageAt({ usage: usage({ dayCount: 7, cycleCount: 40 }), at: cycleDay, billingCycleDay }),
      ).toEqual({ day: "2026-11-05", dayCount: 0, cycleStart: "2026-11-05", cycleCount: 0 });
    });

    test("counts from last month's billing day before this month's", () => {
      expect(
        usageAt({ usage: emptyUsage, at: Date.UTC(2026, 9, 3), billingCycleDay }),
      ).toMatchObject({ cycleStart: "2026-09-05" });
    });

    test("moves a billing day past the month's end to its last day", () => {
      const cycleOf = (day: number) =>
        usageAt({ usage: emptyUsage, at: day, billingCycleDay: 31 }).cycleStart;

      expect(cycleOf(Date.UTC(2026, 1, 28))).toBe("2026-02-28");
      expect(cycleOf(Date.UTC(2026, 1, 27))).toBe("2026-01-31");
      expect(cycleOf(Date.UTC(2026, 2, 30))).toBe("2026-02-28");
      expect(cycleOf(Date.UTC(2028, 1, 29))).toBe("2028-02-29");
    });
  });

  describe("guard", () => {
    test("freezes the canvas once the day's requests pass the limit", () => {
      expect(
        budgetGuard({ usage: usage({ dayCount: 101 }), limits, budgetFrozen: false, at }),
      ).toEqual({ type: "FreezeCanvas", reason: "budget", at });
    });

    test("freezes the canvas once the cycle's requests pass the limit", () => {
      expect(
        budgetGuard({ usage: usage({ cycleCount: 1001 }), limits, budgetFrozen: false, at }),
      ).toEqual({ type: "FreezeCanvas", reason: "budget", at });
    });

    test("leaves the canvas open at the limit", () => {
      const atLimit = usage({ dayCount: 100, cycleCount: 1000 });

      expect(budgetGuard({ usage: atLimit, limits, budgetFrozen: false, at })).toBeNull();
    });

    test("keeps the budget freeze while a limit is still passed", () => {
      expect(
        budgetGuard({
          usage: usage({ dayCount: 1, cycleCount: 1001 }),
          limits,
          budgetFrozen: true,
          at,
        }),
      ).toBeNull();
    });

    test("freezes the canvas when a limit is not a number, so a mistyped secret fails closed", () => {
      const mistyped = { ...limits, perDay: Number("10k") };

      expect(
        budgetGuard({ usage: usage({ dayCount: 1 }), limits: mistyped, budgetFrozen: false, at }),
      ).toEqual({ type: "FreezeCanvas", reason: "budget", at });
    });

    test("lifts the budget freeze once both counts are back under the limits", () => {
      expect(
        budgetGuard({
          usage: usage({ dayCount: 1, cycleCount: 500 }),
          limits,
          budgetFrozen: true,
          at,
        }),
      ).toEqual({ type: "UnfreezeCanvas", reason: "budget", at });
    });
  });
});
