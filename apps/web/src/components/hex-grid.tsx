import type { PublicCanvasView } from "@hexmote/contracts";
import { type Cell, cellKey } from "@hexmote/domain";
import { gridBounds, hexCenter, hexCorners, percentPosition } from "@/lib/hex-geometry";
import type { RecentPaint } from "@/lib/live-view";

const radius = 10;

const pointsOf = (cell: Cell) =>
  hexCorners({ center: hexCenter({ cell, radius }), radius })
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");

type HexGridProps = {
  cells: PublicCanvasView["cells"];
  recentPaints: RecentPaint[];
  onCellClick: (cell: Cell) => void;
};

export function HexGrid({ cells, recentPaints, onCellClick }: HexGridProps) {
  const bounds = gridBounds({ cells: cells.map(({ cell }) => cell), radius });
  const { minX, minY, width, height } = bounds;

  return (
    <div className="relative w-[min(90vw,max(18rem,calc(100dvh-19rem)))]">
      <svg
        className="h-auto w-full overflow-visible"
        viewBox={`${minX} ${minY} ${width} ${height}`}
        role="img"
        aria-label="Canvas"
      >
        {cells.map(({ cell, targetColor, color }) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: mouse only until the grid gets keyboard navigation.
          <polygon
            key={cellKey(cell)}
            className="cursor-pointer hover:opacity-70"
            points={pointsOf(cell)}
            fill={color ?? targetColor}
            fillOpacity={color ? 1 : 0.2}
            onClick={() => onCellClick(cell)}
          />
        ))}
        {recentPaints.map(({ id, cell }) => (
          <polygon
            key={id}
            className="pointer-events-none animate-paint-pulse stroke-foreground"
            points={pointsOf(cell)}
            fill="none"
            strokeWidth={2.5}
          />
        ))}
      </svg>
      {recentPaints.map(({ id, cell, painter }) => {
        const { x, y } = hexCenter({ cell, radius });
        const { left, top } = percentPosition({ point: { x, y: y - radius }, bounds });

        return (
          <span
            key={id}
            className="pointer-events-none absolute mb-1 -translate-x-1/2 animate-paint-pulse whitespace-nowrap rounded-sm bg-background/85 px-1 text-xs font-medium shadow-sm"
            style={{ left: `${left}%`, bottom: `${100 - top}%` }}
          >
            {painter.name}
          </span>
        );
      })}
    </div>
  );
}
