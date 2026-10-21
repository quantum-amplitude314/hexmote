import type { PublicCanvasView } from "@hexmote/contracts";
import { type Cell, cellKey } from "@hexmote/domain";
import { gridBounds, hexCenter, hexCorners } from "@/lib/hex-geometry";
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
  const { minX, minY, width, height } = gridBounds({
    cells: cells.map(({ cell }) => cell),
    radius,
  });

  return (
    <svg
      className="h-auto w-[min(90vw,75dvh)] overflow-visible"
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
      {recentPaints.map(({ id, cell, painter }) => {
        const { x, y } = hexCenter({ cell, radius });

        return (
          <g key={id} className="pointer-events-none animate-paint-pulse">
            <polygon
              points={pointsOf(cell)}
              fill="none"
              className="stroke-foreground"
              strokeWidth={2.5}
            />
            <text
              x={x}
              y={y - radius * 1.5}
              textAnchor="middle"
              fontSize={11}
              paintOrder="stroke"
              className="fill-foreground stroke-background font-medium"
              strokeWidth={3}
            >
              {painter.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
