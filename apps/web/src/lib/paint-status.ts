import type { PaintResult } from "@hexmote/contracts";
import type { Rejection } from "@hexmote/domain";

export type PaintStatus = { nextPaintAt: number | null; message: string; messageUntil: number };

export const idlePaintStatus: PaintStatus = { nextPaintAt: null, message: "", messageUntil: 0 };

type AfterPaint = (input: { result: PaintResult; status: PaintStatus; now: number }) => PaintStatus;

type CooldownText = (input: { nextPaintAt: number | null; now: number }) => string;

const messageShownMs = 3000;

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

/** A message stays while the cooldown runs, and at least 3 s. */
export const withMessage = ({
  nextPaintAt,
  message,
  now,
}: {
  nextPaintAt: number | null;
  message: string;
  now: number;
}) => {
  const messageUntil = Math.max(nextPaintAt ?? now, now + messageShownMs);
  const status: PaintStatus = { nextPaintAt, message, messageUntil };

  return status;
};

export const afterPaint: AfterPaint = ({ result, status, now }) => {
  if (result.status === "painted") {
    return withMessage({ nextPaintAt: result.nextPaintAt, message: "Painted", now });
  }
  const { rejection } = result;
  const retryAt = rejection.reason === "cooldown" ? rejection.retryAt : status.nextPaintAt;
  const rejected = withMessage({ nextPaintAt: retryAt, message: rejectionText(rejection), now });

  return rejected;
};

export const cooldownText: CooldownText = ({ nextPaintAt, now }) => {
  if (nextPaintAt === null || nextPaintAt <= now) return "Ready to paint";
  const secondsLeft = Math.ceil((nextPaintAt - now) / 1000);

  return `Next paint in ${secondsLeft} s`;
};

export const paintStatusText = ({ status, now }: { status: PaintStatus; now: number }) => {
  const { nextPaintAt, message, messageUntil } = status;
  const cooldown = cooldownText({ nextPaintAt, now });
  const text = message && now < messageUntil ? `${cooldown} · ${message}` : cooldown;

  return text;
};
