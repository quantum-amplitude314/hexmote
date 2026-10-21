import grinningFace from "@hexmote/template/grinning-face.json";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { ResponseHeadersPlugin } from "@orpc/server/plugins";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { handleAdminRequest } from "./admin.ts";
import { type Canvas, sessionHeader } from "./canvas.ts";
import { router } from "./router.ts";
import { sessionIdOf } from "./session-cookie.ts";
import type { VerifyTurnstile } from "./turnstile.ts";

type CanvasOf = (env: Env) => DurableObjectStub<Canvas>;

type AppEnv = { Bindings: Env; Variables: { sessionId: string | null } };

const apiHandler = new OpenAPIHandler(router, { plugins: [new ResponseHeadersPlugin()] });

const readSession = createMiddleware<AppEnv>(async (context, next) => {
  const sessionId = await sessionIdOf({ context, signingKey: context.env.SESSION_SIGNING_KEY });
  context.set("sessionId", sessionId);
  await next();
});

export const createApp = ({
  canvasOf,
  verifyTurnstile,
}: {
  canvasOf: CanvasOf;
  verifyTurnstile: VerifyTurnstile;
}) => {
  const app = new Hono<AppEnv>();
  app.use("/live", readSession);
  app.use("/api/*", readSession);

  app.get("/live", async (context) => {
    const sessionId = context.get("sessionId");
    if (!sessionId) return context.text("A session is needed", 401);
    const { raw } = context.req;
    const headers = new Headers(raw.headers);
    headers.set(sessionHeader, sessionId);

    return canvasOf(context.env).fetch(new Request(raw, { headers }));
  });

  app.all("/admin/*", (context) =>
    handleAdminRequest({
      request: context.req.raw,
      canvas: canvasOf(context.env),
      emote: grinningFace,
    }),
  );

  app.all("/api/*", async (context) => {
    const { env } = context;
    const { raw } = context.req;
    const { matched, response } = await apiHandler.handle(raw, {
      prefix: "/api",
      context: {
        canvas: canvasOf(env),
        sessionId: context.get("sessionId"),
        cooldownMs: Number(env.COOLDOWN_MS),
        signingKey: env.SESSION_SIGNING_KEY,
        passesTurnstile: (token) =>
          verifyTurnstile({
            token,
            secret: env.TURNSTILE_SECRET_KEY,
            remoteIp: raw.headers.get("CF-Connecting-IP"),
          }),
      },
    });

    return matched ? response : context.notFound();
  });

  return app;
};
