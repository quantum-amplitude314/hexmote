import { env as startupEnv } from "cloudflare:workers";
import { createRemoteJWKSet } from "jose";
// @ts-expect-error The OpenNext build generates this JavaScript entry without types.
import openNextWorker from "./.open-next/worker.js";
import { handleRequest } from "./src/worker/handle-request";

const { ACCESS_TEAM_DOMAIN: teamDomain } = startupEnv;
const accessKeys = teamDomain
  ? createRemoteJWKSet(new URL("/cdn-cgi/access/certs", teamDomain))
  : null;

export default {
  fetch: (request, env, ctx) =>
    handleRequest({
      request,
      env,
      accessKeys,
      next: (nextRequest) => openNextWorker.fetch(nextRequest, env, ctx),
    }),
} satisfies ExportedHandler<CloudflareEnv>;
