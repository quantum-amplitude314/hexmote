"use client";

import { useLiveView } from "@/lib/use-live-view";
import { HexGrid } from "./hex-grid";

export function LiveCanvas() {
  const view = useLiveView();
  if (!view) return <p>Connecting…</p>;
  if (view.cells.length === 0) return <p>No canvas yet.</p>;

  return (
    <section className="grid justify-items-center gap-2">
      <p className="text-sm text-muted-foreground">
        {view.completionPercent}% complete · {view.status}
      </p>
      <HexGrid cells={view.cells} />
    </section>
  );
}
