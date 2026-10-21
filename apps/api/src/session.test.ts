import { describe, expect, test } from "vitest";
import { painterOf } from "./painter.ts";
import { appOfNewCanvas, passingTurnstileToken, signedSessionCookie } from "./testing/test-app.ts";

const sessionCookieName = "__Host-hexmote-session";
const otherSessionId = "5f0c2a8e-3d1b-4c7a-9e2f-1b6d8c4a7e90";

type FetchApp = Awaited<ReturnType<typeof appOfNewCanvas>>["fetchApp"];

const startSession = ({
  fetchApp,
  turnstileToken,
}: {
  fetchApp: FetchApp;
  turnstileToken: string;
}) =>
  fetchApp("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ turnstileToken }),
  });

const sessionOf = async ({ fetchApp, cookie }: { fetchApp: FetchApp; cookie?: string }) => {
  const response = await fetchApp("/api/session", cookie ? { headers: { Cookie: cookie } } : {});
  const session = await response.json();

  return session;
};

describe("Session", () => {
  test("issues a signed session cookie after a passed Turnstile check", async () => {
    const { fetchApp } = await appOfNewCanvas();

    const response = await startSession({ fetchApp, turnstileToken: passingTurnstileToken });

    const setCookie = response.headers.get("Set-Cookie") ?? "";
    expect(response.status).toBe(200);
    expect(setCookie).toMatch(new RegExp(`^${sessionCookieName}=[0-9a-f-]{36}\\.`));
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
  });

  test("knows the new session on the next request", async () => {
    const { fetchApp } = await appOfNewCanvas();
    const started = await startSession({ fetchApp, turnstileToken: passingTurnstileToken });
    const [cookie = ""] = (started.headers.get("Set-Cookie") ?? "").split(";");

    const session = await sessionOf({ fetchApp, cookie });

    expect(session).toEqual(await started.json());
    expect(session).toMatchObject({ you: { name: expect.stringMatching(/^\w+ \w+$/) } });
  });

  test("refuses a session when the Turnstile check fails", async () => {
    const { fetchApp } = await appOfNewCanvas();

    const response = await startSession({ fetchApp, turnstileToken: "failing-token" });

    expect(response.status).toBe(403);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  test("knows nobody without a session cookie", async () => {
    const { fetchApp } = await appOfNewCanvas();

    expect(await sessionOf({ fetchApp })).toEqual({ you: null });
  });

  test("ignores a session id under a signature made for another id", async () => {
    const { fetchApp } = await appOfNewCanvas();
    const started = await startSession({ fetchApp, turnstileToken: passingTurnstileToken });
    const [cookie = ""] = (started.headers.get("Set-Cookie") ?? "").split(";");
    const signature = cookie.slice(cookie.indexOf(".") + 1);

    const session = await sessionOf({
      fetchApp,
      cookie: `${sessionCookieName}=${otherSessionId}.${signature}`,
    });

    expect(session).toEqual({ you: null });
  });

  test("ignores an unsigned session id", async () => {
    const { fetchApp } = await appOfNewCanvas();

    const session = await sessionOf({ fetchApp, cookie: `${sessionCookieName}=${otherSessionId}` });

    expect(session).toEqual({ you: null });
  });

  test("accepts a session cookie signed by the server", async () => {
    const { fetchApp } = await appOfNewCanvas();

    const session = await sessionOf({
      fetchApp,
      cookie: await signedSessionCookie(otherSessionId),
    });

    expect(session).toEqual({ you: painterOf(otherSessionId) });
  });
});
