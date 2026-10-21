import type { Cell } from "@hexmote/domain";

export type Point = { x: number; y: number };

export type Bounds = { minX: number; minY: number; width: number; height: number };

type HexCenter = (input: { cell: Cell; radius: number }) => Point;
type HexCorners = (input: { center: Point; radius: number }) => Point[];
type GridBounds = (input: { cells: Cell[]; radius: number }) => Bounds;
type PercentPosition = (input: { point: Point; bounds: Bounds }) => { left: number; top: number };

// Pointy-top hexes, the same layout `packages/template` samples the emoji with.
export const hexCenter: HexCenter = ({ cell: { axialQ, axialR }, radius }) => {
  const center = { x: Math.sqrt(3) * radius * (axialQ + axialR / 2), y: 1.5 * radius * axialR };

  return center;
};

export const hexCorners: HexCorners = ({ center: { x, y }, radius }) => {
  const corners = Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;

    return { x: x + radius * Math.cos(angle), y: y + radius * Math.sin(angle) };
  });

  return corners;
};

export const gridBounds: GridBounds = ({ cells, radius }) => {
  const centers = cells.map((cell) => hexCenter({ cell, radius }));
  const halfWidth = (Math.sqrt(3) * radius) / 2;
  const xs = centers.map(({ x }) => x);
  const ys = centers.map(({ y }) => y);
  const minX = Math.min(...xs) - halfWidth;
  const minY = Math.min(...ys) - radius;
  const bounds = {
    minX,
    minY,
    width: Math.max(...xs) + halfWidth - minX,
    height: Math.max(...ys) + radius - minY,
  };

  return bounds;
};

export const percentPosition: PercentPosition = ({
  point: { x, y },
  bounds: { minX, minY, width, height },
}) => {
  const position = { left: ((x - minX) / width) * 100, top: ((y - minY) / height) * 100 };

  return position;
};
