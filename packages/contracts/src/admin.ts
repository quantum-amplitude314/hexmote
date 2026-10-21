import type { CanvasView, Decision } from "@hexmote/domain";

export type AdminCanvasStatus = Pick<
  CanvasView,
  "status" | "paintedPercent" | "freezes" | "resetAt"
> & { exists: boolean };

export type BudgetFreezeRefusal = { status: "refused"; reason: "budgetFreeze" };

export type DeleteResult = { status: "deleted" } | BudgetFreezeRefusal;

export type ResetResult =
  | { status: "reset" }
  | BudgetFreezeRefusal
  | { status: "refused"; reason: "noCanvas" };

export type AdminResult = Decision | DeleteResult | ResetResult;
