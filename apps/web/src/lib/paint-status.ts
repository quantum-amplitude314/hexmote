import type { PaintResult } from "@hexmote/contracts";
import type { Rejection } from "@hexmote/domain";

export type PaintStatus = { nextPaintAt: number | null; message: string };

type AfterPaint = (input: { result: PaintResult; nextPaintAt: number | null }) => PaintStatus;

type CooldownText = (input: { nextPaintAt: number | null; now: number }) => string;

export const rejectionText = (rejection: Rejection) => {
  switch (rejection.reason) {
    case "noCanvas":
      return "No canvas yet";
    case "canvasExists":
      return "The canvas already exists";
    case "templateColorNotInPalette":
      return "The template uses a colour outside the palette";
    case "cellOutsideCanvas":
      return "That cell is outside the emote";
    case "colorNotInPalette":
      return "Pick a colour from the palette";
    case "cooldown":
      return "Too soon, wait for the cooldown";
    case "canvasFrozen":
      return "The canvas is frozen";
    case "canvasCompleted":
      return "The picture is complete";
    default:
      return rejection satisfies never;
  }
};

export const afterPaint: AfterPaint = ({ result, nextPaintAt }) => {
  if (result.status === "painted") {
    const painted: PaintStatus = { nextPaintAt: result.nextPaintAt, message: "Painted" };

    return painted;
  }
  const { rejection } = result;
  const retryAt = rejection.reason === "cooldown" ? rejection.retryAt : nextPaintAt;
  const rejected: PaintStatus = { nextPaintAt: retryAt, message: rejectionText(rejection) };

  return rejected;
};

export const cooldownText: CooldownText = ({ nextPaintAt, now }) => {
  if (nextPaintAt === null || nextPaintAt <= now) return "Ready to paint";
  const secondsLeft = Math.ceil((nextPaintAt - now) / 1000);

  return `Next paint in ${secondsLeft} s`;
};
