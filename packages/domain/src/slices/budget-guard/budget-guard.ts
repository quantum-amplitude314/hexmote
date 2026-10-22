import type { FreezeCanvas, UnfreezeCanvas } from "../../canvas/commands.ts";

export type BudgetLimits = { perDay: number; perCycle: number; billingCycleDay: number };

/** Operational data in Durable Object storage, not events: counting into the stream would flood it. */
export type Usage = { day: string; dayCount: number; cycleStart: string; cycleCount: number };

export const emptyUsage: Usage = { day: "", dayCount: 0, cycleStart: "", cycleCount: 0 };

const dateKeyOf = (time: number) => new Date(time).toISOString().slice(0, 10);

const daysIn = ({ year, month }: { year: number; month: number }) =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const cycleStartIn = ({
  year,
  month,
  billingCycleDay,
}: {
  year: number;
  month: number;
  billingCycleDay: number;
}) => Date.UTC(year, month, Math.min(billingCycleDay, daysIn({ year, month })));

const cycleStartOf = ({ at, billingCycleDay }: { at: number; billingCycleDay: number }) => {
  const date = new Date(at);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const thisMonth = cycleStartIn({ year, month, billingCycleDay });
  const start =
    at >= thisMonth ? thisMonth : cycleStartIn({ year, month: month - 1, billingCycleDay });

  return dateKeyOf(start);
};

export const usageAt = ({
  usage,
  at,
  billingCycleDay,
}: {
  usage: Usage;
  at: number;
  billingCycleDay: number;
}) => {
  const day = dateKeyOf(at);
  const cycleStart = cycleStartOf({ at, billingCycleDay });
  const current: Usage = {
    day,
    dayCount: day === usage.day ? usage.dayCount : 0,
    cycleStart,
    cycleCount: cycleStart === usage.cycleStart ? usage.cycleCount : 0,
  };

  return current;
};

export const countedRequest = (input: { usage: Usage; at: number; billingCycleDay: number }) => {
  const { dayCount, cycleCount, ...periods } = usageAt(input);
  const counted: Usage = { ...periods, dayCount: dayCount + 1, cycleCount: cycleCount + 1 };

  return counted;
};

export const budgetGuard = ({
  usage,
  limits,
  budgetFrozen,
  at,
}: {
  usage: Usage;
  limits: BudgetLimits;
  budgetFrozen: boolean;
  at: number;
}) => {
  const { dayCount, cycleCount } = usage;
  const { perDay, perCycle } = limits;
  const withinBudget = dayCount <= perDay && cycleCount <= perCycle;
  const overBudget = !withinBudget;
  if (overBudget === budgetFrozen) return null;
  const command: FreezeCanvas | UnfreezeCanvas = overBudget
    ? { type: "FreezeCanvas", reason: "budget", at }
    : { type: "UnfreezeCanvas", reason: "budget", at };

  return command;
};
