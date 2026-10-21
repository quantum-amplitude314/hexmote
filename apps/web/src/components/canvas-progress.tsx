import type { PublicCanvasView } from "@hexmote/contracts";
import { progressLabel } from "@/lib/progress-label";
import { useNow } from "@/lib/use-now";
import { Progress, ProgressLabel, ProgressValue } from "./ui/progress";

type CanvasProgressProps = Pick<PublicCanvasView, "paintedPercent" | "status" | "resetAt">;

const oneDecimalPercent: Intl.NumberFormatOptions = {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

/** Its own component, so the countdown re-renders the bar and not the grid. */
export function CanvasProgress({ paintedPercent, status, resetAt }: CanvasProgressProps) {
  const now = useNow({ until: status === "completed" ? resetAt : null, tickMs: 1000 });

  return (
    <Progress
      value={paintedPercent / 100}
      max={1}
      format={oneDecimalPercent}
      className="w-full max-w-xs"
      indicatorClassName="bg-linear-to-r from-place-blue to-place-pink data-complete:bg-none data-complete:bg-place-green"
    >
      <ProgressLabel>{progressLabel({ status, resetAt, now })}</ProgressLabel>
      <ProgressValue />
    </Progress>
  );
}
