import { createApp } from "./app.ts";
import { verifyTurnstileWithCloudflare } from "./turnstile.ts";

export { Canvas } from "./canvas.ts";

const canvasName = "main";

export default createApp({
  canvasOf: (env) => env.CANVAS.getByName(canvasName),
  verifyTurnstile: verifyTurnstileWithCloudflare,
});
