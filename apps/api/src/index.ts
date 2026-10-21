export { Canvas } from "./canvas.ts";

const canvasName = "main";

export default {
  fetch: (request, env) => {
    const { pathname } = new URL(request.url);
    if (pathname === "/live") return env.CANVAS.getByName(canvasName).fetch(request);

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
