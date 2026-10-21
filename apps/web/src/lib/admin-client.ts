import type { AdminCanvasStatus, AdminResult } from "@hexmote/contracts";
import type { AdminCommand, AdminOutcome, FailedRequest } from "./admin-text";

type StatusRequest = { status: "loaded"; canvas: AdminCanvasStatus } | FailedRequest;

const commandRequests: Record<AdminCommand, { method: "POST" | "DELETE"; path: string }> = {
  create: { method: "POST", path: "/admin/canvas" },
  freeze: { method: "POST", path: "/admin/freeze" },
  unfreeze: { method: "POST", path: "/admin/unfreeze" },
  reset: { method: "POST", path: "/admin/reset" },
  delete: { method: "DELETE", path: "/admin/canvas" },
};

const decidedStatuses = new Set([200, 409]);

const noResponse: FailedRequest = { status: "failed", httpStatus: null };

/** Same origin, so the Access cookie goes along; `next dev` rewrites `/admin/*` to the API. */
export const runAdminCommand = async (command: AdminCommand) => {
  const { method, path } = commandRequests[command];
  const outcome: AdminOutcome = await fetch(path, { method }).then(
    async (response) =>
      decidedStatuses.has(response.status)
        ? ((await response.json()) as AdminResult)
        : { status: "failed", httpStatus: response.status },
    () => noResponse,
  );

  return outcome;
};

export const fetchAdminStatus = async () => {
  const request: StatusRequest = await fetch("/admin/canvas").then(
    async (response) =>
      response.ok
        ? { status: "loaded", canvas: (await response.json()) as AdminCanvasStatus }
        : { status: "failed", httpStatus: response.status },
    () => noResponse,
  );

  return request;
};
