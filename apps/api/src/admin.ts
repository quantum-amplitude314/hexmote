import type { CreateCanvas, Decision } from "@hexmote/domain";
import type { Canvas, DeleteResult } from "./canvas.ts";

type HandleAdminRequest = (input: {
  request: Request;
  canvas: DurableObjectStub<Canvas>;
  emote: Pick<CreateCanvas, "palette" | "template">;
}) => Promise<Response>;

const decisionResponse = (decision: Decision) =>
  Response.json(decision, { status: decision.status === "accepted" ? 200 : 409 });

const deleteResponse = (result: DeleteResult) =>
  result.status === "deleted"
    ? new Response(null, { status: 204 })
    : Response.json(result, { status: 409 });

export const handleAdminRequest: HandleAdminRequest = async ({ request, canvas, emote }) => {
  const { pathname } = new URL(request.url);
  const at = Date.now();
  switch (`${request.method} ${pathname}`) {
    case "POST /admin/canvas":
      return decisionResponse(await canvas.handleCommand({ type: "CreateCanvas", ...emote, at }));
    case "POST /admin/freeze":
      return decisionResponse(
        await canvas.handleCommand({ type: "FreezeCanvas", reason: "manual", at }),
      );
    case "POST /admin/unfreeze":
      return decisionResponse(
        await canvas.handleCommand({ type: "UnfreezeCanvas", reason: "manual", at }),
      );
    case "DELETE /admin/canvas":
      return deleteResponse(await canvas.deleteCanvas());
    default:
      return new Response("Not found", { status: 404 });
  }
};
