import type { AdminCanvasStatus, AdminResult, BudgetFreezeRefusal } from "@hexmote/contracts";
import type { FreezeReason, Rejection } from "@hexmote/domain";
import { progressLabel } from "./progress-label";

export type AdminCommand = "create" | "freeze" | "unfreeze" | "reset" | "delete";

export type FailedRequest = { status: "failed"; httpStatus: number | null };

export type AdminOutcome = AdminResult | FailedRequest;

const doneTexts: Record<AdminCommand, string> = {
  create: "Created",
  freeze: "Frozen",
  unfreeze: "Unfrozen",
  reset: "A new round started",
  delete: "Deleted",
};

const frozenByTexts: Record<FreezeReason, string> = {
  budget: "by the budget guard",
  manual: "by you",
};

const reasonTexts: Partial<Record<Rejection["reason"] | BudgetFreezeRefusal["reason"], string>> = {
  canvasExists: "the canvas already exists",
  noCanvas: "there is no canvas yet",
  budgetFreeze: "the budget freeze is on, and only the budget guard lifts it",
};

const reasonText = (reason: keyof typeof reasonTexts) => reasonTexts[reason] ?? reason;

export const failedRequestText = ({ httpStatus }: FailedRequest) =>
  httpStatus ? `Failed: HTTP ${httpStatus}` : "Failed: no response";

export const adminStatusText = ({ status, now }: { status: AdminCanvasStatus; now: number }) => {
  const { exists, status: canvasStatus, paintedPercent, freezes, resetAt } = status;
  if (!exists) return "No canvas yet";
  const painted = `${paintedPercent.toFixed(1)}% painted`;
  if (canvasStatus === "completed") return progressLabel({ status: canvasStatus, resetAt, now });
  if (canvasStatus === "open") return `Open · ${painted}`;
  const frozenBy = freezes.map((reason) => frozenByTexts[reason]).join(" and ");
  const text = `Frozen ${frozenBy} · ${painted}`;

  return text;
};

export const adminResultText = ({
  command,
  outcome,
}: {
  command: AdminCommand;
  outcome: AdminOutcome;
}) => {
  switch (outcome.status) {
    case "accepted":
      return outcome.events.length > 0 ? doneTexts[command] : "Nothing changed";
    case "reset":
    case "deleted":
      return doneTexts[command];
    case "rejected":
      return `Rejected: ${reasonText(outcome.rejection.reason)}`;
    case "refused":
      return `Refused: ${reasonText(outcome.reason)}`;
    case "failed":
      return failedRequestText(outcome);
    default:
      return outcome satisfies never;
  }
};
