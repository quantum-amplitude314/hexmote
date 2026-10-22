"use client";

import { useContext, useState } from "react";
import { useLiveView } from "@/lib/use-live-view";
import { usePaint } from "@/lib/use-paint";
import { CanvasProgress } from "./canvas-progress";
import { ColorPalette } from "./color-palette";
import { HexGrid } from "./hex-grid";
import { OnlineBar } from "./online-bar";
import { RecheckSession } from "./session-gate";

export function LiveCanvas() {
  const recheckSession = useContext(RecheckSession);
  const { view, you, online, recentPaints, connected } = useLiveView({
    onRefused: recheckSession,
  });
  const { paint, statusText } = usePaint();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  if (!view) return <p>Connecting…</p>;
  const { palette, cells, paintedPercent, status, resetAt } = view;
  const [firstColor] = palette;
  if (cells.length === 0 || !firstColor) return <p>No canvas yet.</p>;
  const color = selectedColor ?? firstColor;

  return (
    <section className="grid w-full justify-items-center gap-3">
      <OnlineBar you={you} online={online} connected={connected} />
      <CanvasProgress paintedPercent={paintedPercent} status={status} resetAt={resetAt} />
      <div className="grid w-full justify-items-center overflow-x-clip py-5">
        <HexGrid
          cells={cells}
          recentPaints={recentPaints}
          onCellClick={(cell) => paint({ cell, color })}
        />
      </div>
      <div className="sticky bottom-2 grid justify-items-center gap-2 rounded-xl border bg-background/90 p-2 shadow-lg backdrop-blur-sm">
        <ColorPalette palette={palette} selected={color} onSelect={setSelectedColor} />
        <p className="text-sm" aria-live="polite">
          {statusText}
        </p>
      </div>
    </section>
  );
}
