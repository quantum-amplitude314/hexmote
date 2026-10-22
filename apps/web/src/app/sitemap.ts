import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";

const sitemap = async () => {
  const { WEB_ORIGIN: webOrigin } = await getEnv();
  const entries: MetadataRoute.Sitemap = [{ url: new URL("/", webOrigin).href }];

  return entries;
};

export default sitemap;
