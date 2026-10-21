import type { Context } from "hono";
import { generateSignedCookie, getSignedCookie } from "hono/cookie";
import { z } from "zod";

const sessionCookieName = "hexmote-session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;
const sessionIdSchema = z.uuid();

export const sessionCookieFor = ({
  sessionId,
  signingKey,
}: {
  sessionId: string;
  signingKey: string;
}) =>
  generateSignedCookie(sessionCookieName, sessionId, signingKey, {
    prefix: "host",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: sessionMaxAgeSeconds,
  });

export const sessionIdOf = async ({
  context,
  signingKey,
}: {
  context: Context;
  signingKey: string;
}) => {
  const value = await getSignedCookie(context, signingKey, sessionCookieName, "host");
  const { success, data } = sessionIdSchema.safeParse(value);
  const sessionId = success ? data : null;

  return sessionId;
};
