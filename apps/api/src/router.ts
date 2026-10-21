import { contract, type PaintResult, type Session } from "@hexmote/contracts";
import { implement, ORPCError } from "@orpc/server";
import type { ResponseHeadersPluginContext } from "@orpc/server/plugins";
import type { Canvas } from "./canvas.ts";
import { painterOf } from "./painter.ts";
import { sessionCookieFor } from "./session-cookie.ts";

export type ApiContext = ResponseHeadersPluginContext & {
  canvas: DurableObjectStub<Canvas>;
  sessionId: string | null;
  cooldownMs: number;
  signingKey: string;
  passesTurnstile: (token: string) => Promise<boolean>;
};

const os = implement(contract).$context<ApiContext>();

const sessionOf = (sessionId: string | null) => {
  const session: Session = { you: sessionId ? painterOf(sessionId) : null };

  return session;
};

export const router = os.router({
  paintCell: os.paintCell.handler(async ({ context, input }) => {
    const { canvas, sessionId, cooldownMs } = context;
    if (!sessionId) throw new ORPCError("UNAUTHORIZED");
    const { cell, color } = input;
    const at = Date.now();
    const decision = await canvas.handleCommand({ type: "PaintCell", sessionId, cell, color, at });
    const result: PaintResult =
      decision.status === "accepted"
        ? { status: "painted", nextPaintAt: at + cooldownMs }
        : { status: "rejected", rejection: decision.rejection };

    return result;
  }),
  session: {
    get: os.session.get.handler(({ context }) => sessionOf(context.sessionId)),
    create: os.session.create.handler(async ({ context, input }) => {
      const { passesTurnstile, signingKey, resHeaders } = context;
      if (!(await passesTurnstile(input.turnstileToken))) throw new ORPCError("FORBIDDEN");
      const sessionId = crypto.randomUUID();
      resHeaders?.append("Set-Cookie", await sessionCookieFor({ sessionId, signingKey }));

      return sessionOf(sessionId);
    }),
  },
});
