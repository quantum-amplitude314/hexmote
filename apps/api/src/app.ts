import grinningFace from "@hexmote/template/grinning-face.json";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { Hono } from "hono";
import { generateCookie, getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { handleAdminRequest } from "./admin.ts";
import { type Canvas, sessionHeader } from "./canvas.ts";
import { paintRouter } from "./paint.ts";

type CanvasOf = (env: Env) => DurableObjectStub<Canvas>;

type AppEnv = {
  Bindings: Env;
  Variables: { sessionId: string; newSessionCookie: string | null };
};

const sessionCookie = "hexmote-session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;
const sessionIdSchema = z.uuid();

const paintHandler = new OpenAPIHandler(paintRouter);

const withSessionCookie = ({
  response,
  newSessionCookie,
}: {
  response: Response;
  newSessionCookie: string | null;
}) => {
  if (!newSessionCookie) return response;
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", newSessionCookie);
  const { status, statusText, webSocket } = response;
  const withCookie = new Response(response.body, { status, statusText, headers, webSocket });

  return withCookie;
};

// Anonymous until Turnstile and signing arrive; only a UUID is accepted, so ids stay small.
const readSession = createMiddleware<AppEnv>(async (context, next) => {
  const cookieValue = getCookie(context, sessionCookie, "host");
  const { success: known, data: knownId } = sessionIdSchema.safeParse(cookieValue);
  const sessionId = known ? knownId : crypto.randomUUID();
  const newSessionCookie = known
    ? null
    : generateCookie(sessionCookie, sessionId, {
        prefix: "host",
        httpOnly: true,
        sameSite: "Lax",
        maxAge: sessionMaxAgeSeconds,
      });
  context.set("sessionId", sessionId);
  context.set("newSessionCookie", newSessionCookie);
  await next();
});

export const createApp = ({ canvasOf }: { canvasOf: CanvasOf }) => {
  const app = new Hono<AppEnv>();
  app.use("/live", readSession);
  app.use("/api/*", readSession);

  app.get("/live", async (context) => {
    const { raw } = context.req;
    const headers = new Headers(raw.headers);
    headers.set(sessionHeader, context.get("sessionId"));
    const response = await canvasOf(context.env).fetch(new Request(raw, { headers }));

    return withSessionCookie({ response, newSessionCookie: context.get("newSessionCookie") });
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
    const { matched, response } = await paintHandler.handle(context.req.raw, {
      prefix: "/api",
      context: {
        canvas: canvasOf(env),
        sessionId: context.get("sessionId"),
        cooldownMs: Number(env.COOLDOWN_MS),
      },
    });
    if (!matched) return context.notFound();

    return withSessionCookie({ response, newSessionCookie: context.get("newSessionCookie") });
  });

  return app;
};
