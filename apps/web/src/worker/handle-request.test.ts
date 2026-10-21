import { describe, expect, test } from "bun:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { handleRequest, type WorkerEnv } from "./handle-request";

const issuer = "https://hexmote.cloudflareaccess.com";
const audience = "hexmote-admin";
const signingAlgorithm = "RS256";

const accessKeyPair = await generateKeyPair(signingAlgorithm);
const otherKeyPair = await generateKeyPair(signingAlgorithm);
const accessKeys = createLocalJWKSet({
  keys: [{ ...(await exportJWK(accessKeyPair.publicKey)), kid: "access", alg: signingAlgorithm }],
});

const api = { fetch: async () => new Response("api") };
const next = async () => new Response("next");
const productionEnv: WorkerEnv = { API: api, ACCESS_TEAM_DOMAIN: issuer, ACCESS_AUD: audience };

const accessToken = ({
  tokenAudience = audience,
  expiresAt = "1h",
  signingKey = accessKeyPair.privateKey,
}: {
  tokenAudience?: string;
  expiresAt?: string | number;
  signingKey?: CryptoKey;
} = {}) =>
  new SignJWT({ email: "admin@example.com" })
    .setProtectedHeader({ alg: signingAlgorithm, kid: "access" })
    .setIssuer(issuer)
    .setAudience(tokenAudience)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(signingKey);

const route = async ({
  path,
  token,
  env = productionEnv,
}: {
  path: string;
  token?: string;
  env?: WorkerEnv;
}) => {
  const headers: HeadersInit = token ? { "Cf-Access-Jwt-Assertion": token } : {};
  const request = new Request(`https://hexmote.test${path}`, { method: "POST", headers });
  const response = await handleRequest({ request, env, accessKeys, next });
  const routed = { status: response.status, body: await response.text() };

  return routed;
};

describe("handleRequest", () => {
  test("forwards /live to the API", async () => {
    expect(await route({ path: "/live" })).toEqual({ status: 200, body: "api" });
  });

  test("sends other paths to Next", async () => {
    expect(await route({ path: "/" })).toEqual({ status: 200, body: "next" });
  });

  test("forwards an admin command with a valid Access token to the API", async () => {
    const token = await accessToken();

    expect(await route({ path: "/admin/freeze", token })).toEqual({ status: 200, body: "api" });
  });

  test("sends the admin page to Next only with a valid Access token", async () => {
    const token = await accessToken();

    expect(await route({ path: "/admin", token })).toEqual({ status: 200, body: "next" });
    expect((await route({ path: "/admin" })).status).toBe(403);
  });

  test("refuses an admin command without an Access token", async () => {
    expect((await route({ path: "/admin/freeze" })).status).toBe(403);
  });

  test("refuses a token signed by another key", async () => {
    const token = await accessToken({ signingKey: otherKeyPair.privateKey });

    expect((await route({ path: "/admin/freeze", token })).status).toBe(403);
  });

  test("refuses a token for another Access application", async () => {
    const token = await accessToken({ tokenAudience: "another-app" });

    expect((await route({ path: "/admin/freeze", token })).status).toBe(403);
  });

  test("refuses an expired token", async () => {
    const token = await accessToken({ expiresAt: Math.floor(Date.now() / 1000) - 60 });

    expect((await route({ path: "/admin/freeze", token })).status).toBe(403);
  });

  test("refuses every admin request when the Access secrets are missing", async () => {
    const token = await accessToken();

    expect((await route({ path: "/admin/freeze", token, env: { API: api } })).status).toBe(403);
  });

  test("lets preview skip the check", async () => {
    const env: WorkerEnv = { API: api, SKIP_ACCESS_CHECK: "true" };

    expect(await route({ path: "/admin/freeze", env })).toEqual({ status: 200, body: "api" });
  });

  test("runs the check for any other skip value", async () => {
    const env: WorkerEnv = { ...productionEnv, SKIP_ACCESS_CHECK: "TRUE" };

    expect((await route({ path: "/admin/freeze", env })).status).toBe(403);
  });
});
