import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { cooldownMs, resetAfterMs } from "@hexmote/domain/testing";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: { COOLDOWN_MS: String(cooldownMs), RESET_AFTER_MS: String(resetAfterMs) },
      },
    }),
  ],
});
