import type { PublicCanvasView } from "@hexmote/contracts";

type ProgressLabel = (
  input: Pick<PublicCanvasView, "status" | "resetAt"> & { now: number },
) => string;

const secondsPerMinute = 60;
const secondsPerHour = 60 * secondsPerMinute;

const timeLeftText = (milliseconds: number) => {
  const seconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(seconds / secondsPerHour);
  const minutes = Math.floor((seconds % secondsPerHour) / secondsPerMinute);
  if (hours > 0) return `${hours} h ${minutes} min`;
  const text = minutes > 0 ? `${minutes} min` : `${seconds} s`;

  return text;
};

export const progressLabel: ProgressLabel = ({ status, resetAt, now }) => {
  if (status === "frozen") return "Painted · frozen";
  if (status === "open" || resetAt === null) return "Painted";
  if (resetAt <= now) return "Complete · new round starting";
  const label = `Complete · new round in ${timeLeftText(resetAt - now)}`;

  return label;
};
