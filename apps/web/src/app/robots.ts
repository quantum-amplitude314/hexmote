import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";

const robots = async () => {
  const { WEB_ORIGIN: webOrigin } = await getEnv();
  const config: MetadataRoute.Robots = {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: new URL("/sitemap.xml", webOrigin).href,
  };

  return config;
};

export default robots;
