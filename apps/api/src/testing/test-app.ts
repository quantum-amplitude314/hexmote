import { env } from "cloudflare:workers";
import { createCanvas } from "@hexmote/domain/testing";
import { createApp } from "../app.ts";
import { sessionCookieFor } from "../session-cookie.ts";
import type { VerifyTurnstile } from "../turnstile.ts";

export const passingTurnstileToken = "passing-token";

const verifyTurnstile: VerifyTurnstile = async ({ token }) => token === passingTurnstileToken;

/** `name=value`, as the browser sends it back. */
export const signedSessionCookie = async (sessionId: string) => {
  const setCookie = await sessionCookieFor({ sessionId, signingKey: env.SESSION_SIGNING_KEY });
  const [cookie = ""] = setCookie.split(";");

  return cookie;
};

export const appOfNewCanvas = async () => {
  const canvas = env.CANVAS.get(env.CANVAS.newUniqueId());
  await canvas.handleCommand(createCanvas);
  const app = createApp({ canvasOf: () => canvas, verifyTurnstile });
  const fetchApp = async (input: string, init?: RequestInit) =>
    app.request(new URL(input, "http://hexmote"), init, env);
  const tested = { canvas, fetchApp };

  return tested;
};
