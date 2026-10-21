import type { PublicCanvasView } from "@hexmote/contracts";
import { cellKey } from "@hexmote/domain";
import { gridBounds, hexCenter, hexCorners } from "@/lib/hex-geometry";

const radius = 10;

export function HexGrid({ cells }: { cells: PublicCanvasView["cells"] }) {
  const { minX, minY, width, height } = gridBounds({
    cells: cells.map(({ cell }) => cell),
    radius,
  });

  return (
    <svg
      className="h-auto w-[min(90vw,75dvh)]"
      viewBox={`${minX} ${minY} ${width} ${height}`}
      role="img"
    >
      <title>Canvas</title>
      {cells.map(({ cell, targetColor, color }) => (
        <polygon
          key={cellKey(cell)}
          points={hexCorners({ center: hexCenter({ cell, radius }), radius })
            .map(({ x, y }) => `${x},${y}`)
            .join(" ")}
          fill={color ?? targetColor}
          fillOpacity={color ? 1 : 0.2}
        />
      ))}
    </svg>
  );
}
