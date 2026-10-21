import type { Cell, HexCodeColor } from "@hexmote/domain";
import { useState } from "react";
import { apiClient } from "./api-client";
import {
  afterPaint,
  idlePaintStatus,
  type PaintStatus,
  paintStatusText,
  withMessage,
} from "./paint-status";
import { useNow } from "./use-now";

export const usePaint = () => {
  const [status, setStatus] = useState<PaintStatus>(idlePaintStatus);
  const { nextPaintAt, messageUntil } = status;
  const now = useNow({ until: Math.max(nextPaintAt ?? 0, messageUntil), tickMs: 250 });
  const paint = async ({ cell, color }: { cell: Cell; color: HexCodeColor }) => {
    try {
      const result = await apiClient.paintCell({ cell, color });
      setStatus((current) => afterPaint({ result, status: current, now: Date.now() }));
    } catch {
      setStatus((current) =>
        withMessage({
          nextPaintAt: current.nextPaintAt,
          message: "Paint failed, try again",
          now: Date.now(),
        }),
      );
    }
  };
  const painting = { paint, statusText: paintStatusText({ status, now }) };

  return painting;
};
