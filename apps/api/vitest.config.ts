import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { cooldownMs, resetAfterMs } from "@hexmote/domain/testing";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          COOLDOWN_MS: String(cooldownMs),
          RESET_AFTER_MS: String(resetAfterMs),
          SESSION_SIGNING_KEY: "test-signing-key",
          TURNSTILE_SECRET_KEY: "test-turnstile-secret",
          BUDGET_PER_DAY: "1000",
          BUDGET_PER_CYCLE: "5000",
          BILLING_CYCLE_DAY: "5",
        },
      },
    }),
  ],
});
