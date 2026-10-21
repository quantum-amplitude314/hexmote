import type { Cell, HexCodeColor } from "@hexmote/domain";
import { useEffect, useState } from "react";
import { apiClient } from "./api-client";
import { afterPaint, cooldownText, type PaintStatus } from "./paint-status";

const tickMs = 250;

const useNow = (until: number | null) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) clearInterval(timer);
    }, tickMs);

    return () => clearInterval(timer);
  }, [until]);

  return now;
};

export const usePaint = () => {
  const [status, setStatus] = useState<PaintStatus>({ nextPaintAt: null, message: "" });
  const now = useNow(status.nextPaintAt);
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
