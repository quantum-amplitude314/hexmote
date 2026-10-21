import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { cooldownMs } from "@hexmote/domain/testing";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: { bindings: { COOLDOWN_MS: String(cooldownMs) } },
    }),
  ],
});
