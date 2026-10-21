import { paintCell, template } from "@hexmote/domain/testing";
import type { Canvas } from "../canvas.ts";

/** One session per cell, so no cooldown applies; `at` defaults to now so the reset alarm lies ahead. */
export const completeCanvas = async ({
  canvas,
  at = Date.now(),
}: {
  canvas: DurableObjectStub<Canvas>;
  at?: number;
}) => {
  for (const [index, { cell, color }] of template.entries()) {
    await canvas.handleCommand(paintCell({ cell, color, sessionId: `painter-${index}`, at }));
  }
};
