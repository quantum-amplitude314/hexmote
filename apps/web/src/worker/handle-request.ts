import type { JWTVerifyGetKey } from "jose";
import { type AccessEnv, hasAdminAccess } from "./access";

type ApiService = { fetch: (request: Request) => Promise<Response> };

export type WorkerEnv = AccessEnv & { API: ApiService };

type HandleRequest = (input: {
  request: Request;
  env: WorkerEnv;
  accessKeys: JWTVerifyGetKey | null;
  next: (request: Request) => Promise<Response>;
}) => Promise<Response>;

const adminPage = "/admin";

const isAdminPath = (pathname: string) =>
  pathname === adminPage || pathname.startsWith(`${adminPage}/`);

export const handleRequest: HandleRequest = async ({ request, env, accessKeys, next }) => {
  const { pathname } = new URL(request.url);
  if (pathname === "/live") return env.API.fetch(request);
  if (!isAdminPath(pathname)) return next(request);
  if (!(await hasAdminAccess({ request, env, accessKeys }))) {
    return new Response("Forbidden", { status: 403 });
  }

  return pathname === adminPage ? next(request) : env.API.fetch(request);
};
