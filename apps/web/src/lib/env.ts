import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const getEnv = async () => {
  const { env } = await getCloudflareContext({ async: true });

  return env;
};
