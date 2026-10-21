import grinningFace from "@hexmote/template/grinning-face.json";
import { handleAdminRequest } from "./admin.ts";

export { Canvas } from "./canvas.ts";

const canvasName = "main";

export default {
  fetch: (request, env) => {
    const { pathname } = new URL(request.url);
    const canvas = env.CANVAS.getByName(canvasName);
    if (pathname === "/live") return canvas.fetch(request);
    if (pathname.startsWith("/admin/")) {
      return handleAdminRequest({ request, canvas, emote: grinningFace });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
