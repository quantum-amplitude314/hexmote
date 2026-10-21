import type { Cell, HexCodeColor } from "@hexmote/domain";
import { useState } from "react";
import { apiClient } from "./api-client";
import { afterPaint, cooldownText, type PaintStatus } from "./paint-status";
import { useNow } from "./use-now";

export const usePaint = () => {
  const [status, setStatus] = useState<PaintStatus>({ nextPaintAt: null, message: "" });
  const now = useNow({ until: status.nextPaintAt, tickMs: 250 });
  const paint = async ({ cell, color }: { cell: Cell; color: HexCodeColor }) => {
    try {
      const result = await apiClient.paintCell({ cell, color });
      setStatus(({ nextPaintAt }) => afterPaint({ result, nextPaintAt }));
    } catch {
      setStatus(({ nextPaintAt }) => ({ nextPaintAt, message: "Paint failed, try again" }));
    }
  };
  const painting = {
    paint,
    cooldown: cooldownText({ nextPaintAt: status.nextPaintAt, now }),
    message: status.message,
  };

  return painting;
};
