/** Axial hex coordinates. */
export type Cell = { q: number; r: number };

/** Hex colour from the canvas palette, e.g. `#e53935`. */
export type Color = string;

export type TemplateCell = { cell: Cell; color: Color };
