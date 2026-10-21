"use client";

import { useState } from "react";
import { useLiveView } from "@/lib/use-live-view";
import { usePaint } from "@/lib/use-paint";
import { CanvasProgress } from "./canvas-progress";
import { ColorPalette } from "./color-palette";
import { HexGrid } from "./hex-grid";
import { OnlineBar } from "./online-bar";

export function LiveCanvas() {
  const { view, you, online, recentPaints } = useLiveView();
  const { paint, cooldown, message } = usePaint();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  if (!view) return <p>Connecting…</p>;
  const { palette, cells, paintedPercent, status, resetAt } = view;
  const [firstColor] = palette;
  if (cells.length === 0 || !firstColor) return <p>No canvas yet.</p>;
  const color = selectedColor ?? firstColor;

  return (
    <section className="grid justify-items-center gap-3">
      <OnlineBar you={you} online={online} />
      <CanvasProgress paintedPercent={paintedPercent} status={status} resetAt={resetAt} />
      <div className="py-5">
        <HexGrid
          cells={cells}
          recentPaints={recentPaints}
          onCellClick={(cell) => paint({ cell, color })}
        />
      </div>
      <ColorPalette palette={palette} selected={color} onSelect={setSelectedColor} />
      <p className="text-sm" aria-live="polite">
        {cooldown}
        {message && ` · ${message}`}
      </p>
    </section>
  );
}
