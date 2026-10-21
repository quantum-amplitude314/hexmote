import { createApp } from "./app.ts";

export { Canvas } from "./canvas.ts";

const canvasName = "main";

export default createApp({ canvasOf: (env) => env.CANVAS.getByName(canvasName) });
