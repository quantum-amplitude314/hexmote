import { contract, type PaintResult } from "@hexmote/contracts";
import { implement } from "@orpc/server";
import type { Canvas } from "./canvas.ts";

export type PaintContext = {
  canvas: DurableObjectStub<Canvas>;
  sessionId: string;
  cooldownMs: number;
};

const os = implement(contract).$context<PaintContext>();

export const paintRouter = os.router({
  paintCell: os.paintCell.handler(async ({ context, input }) => {
    const { canvas, sessionId, cooldownMs } = context;
    const { cell, color } = input;
    const at = Date.now();
    const decision = await canvas.handleCommand({ type: "PaintCell", sessionId, cell, color, at });
    const result: PaintResult =
      decision.status === "accepted"
        ? { status: "painted", nextPaintAt: at + cooldownMs }
        : { status: "rejected", rejection: decision.rejection };

    return result;
  }),
});
