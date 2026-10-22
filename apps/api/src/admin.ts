import type { AdminCanvasStatus, AdminResult } from "@hexmote/contracts";
import type { BudgetLimits, CanvasView, CreateCanvas, Usage } from "@hexmote/domain";
import type { Canvas } from "./canvas.ts";

type HandleAdminRequest = (input: {
  request: Request;
  canvas: DurableObjectStub<Canvas>;
  emote: Pick<CreateCanvas, "palette" | "template">;
}) => Promise<Response>;

const resultResponse = (result: AdminResult) =>
  Response.json(result, {
    status: result.status === "rejected" || result.status === "refused" ? 409 : 200,
  });

const adminStatusOf = ({
  view: { cells, status, paintedPercent, freezes, resetAt },
  budget: {
    usage: { dayCount, cycleCount },
    limits: { perDay, perCycle },
  },
}: {
  view: CanvasView;
  budget: { usage: Usage; limits: BudgetLimits };
}) => {
  const adminStatus: AdminCanvasStatus = {
    exists: cells.length > 0,
    status,
    paintedPercent,
    freezes,
    resetAt,
    budget: { dayCount, perDay, cycleCount, perCycle },
  };

  return adminStatus;
};

export const handleAdminRequest: HandleAdminRequest = async ({ request, canvas, emote }) => {
  const { pathname } = new URL(request.url);
  const at = Date.now();
  switch (`${request.method} ${pathname}`) {
    case "GET /admin/canvas":
      return Response.json(
        adminStatusOf({ view: await canvas.getView(), budget: await canvas.getBudget() }),
      );
    case "POST /admin/canvas":
      return resultResponse(await canvas.handleCommand({ type: "CreateCanvas", ...emote, at }));
    case "POST /admin/freeze":
      return resultResponse(
        await canvas.handleCommand({ type: "FreezeCanvas", reason: "manual", at }),
      );
    case "POST /admin/unfreeze":
      return resultResponse(
        await canvas.handleCommand({ type: "UnfreezeCanvas", reason: "manual", at }),
      );
    case "POST /admin/reset":
      return resultResponse(await canvas.resetCanvas());
    case "DELETE /admin/canvas":
      return resultResponse(await canvas.deleteCanvas());
    default:
      return new Response("Not found", { status: 404 });
  }
};
