import { runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { emptyUsage, type Usage, usageAt } from "@hexmote/domain";
import { freezeCanvas } from "@hexmote/domain/testing";
import { type Canvas, usageKey } from "../canvas.ts";

type CanvasStub = DurableObjectStub<Canvas>;

export const perDay = Number(env.BUDGET_PER_DAY);
export const perCycle = Number(env.BUDGET_PER_CYCLE);

export const usageToday = ({ dayCount, cycleCount }: { dayCount: number; cycleCount: number }) => {
  const billingCycleDay = Number(env.BILLING_CYCLE_DAY);
  const usage: Usage = {
    ...usageAt({ usage: emptyUsage, at: Date.now(), billingCycleDay }),
    dayCount,
    cycleCount,
  };

  return usage;
};

export const storedUsageOf = (canvas: CanvasStub) =>
  runInDurableObject(canvas, (_canvas, { storage }) => storage.get<Usage>(usageKey));

export const storeUsage = ({ canvas, usage }: { canvas: CanvasStub; usage: Usage }) =>
  runInDurableObject(canvas, (_canvas, { storage }) => storage.put(usageKey, usage));

/** Usage at the day's limit, so the guard freezes the canvas on the next request, as in prod. */
export const freezeForBudget = async (canvas: CanvasStub) => {
  await storeUsage({ canvas, usage: usageToday({ dayCount: perDay, cycleCount: perDay }) });
  await canvas.handleCommand(freezeCanvas({ reason: "budget" }));
};
