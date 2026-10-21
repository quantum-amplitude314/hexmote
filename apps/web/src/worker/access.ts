import { type JWTVerifyGetKey, jwtVerify } from "jose";

export type AccessEnv = {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  SKIP_ACCESS_CHECK?: string;
};

type HasAdminAccess = (input: {
  request: Request;
  env: AccessEnv;
  accessKeys: JWTVerifyGetKey | null;
}) => Promise<boolean>;

const accessTokenHeader = "Cf-Access-Jwt-Assertion";
const accessSigningAlgorithms = ["RS256"];

export const hasAdminAccess: HasAdminAccess = async ({ request, env, accessKeys }) => {
  const { ACCESS_TEAM_DOMAIN: issuer, ACCESS_AUD: audience, SKIP_ACCESS_CHECK } = env;
  if (SKIP_ACCESS_CHECK === "true") return true;
  const token = request.headers.get(accessTokenHeader);
  if (!token || !accessKeys || !issuer || !audience) return false;
  const verified = await jwtVerify(token, accessKeys, {
    issuer,
    audience,
    algorithms: accessSigningAlgorithms,
  }).then(
    () => true,
    () => false,
  );

  return verified;
};
