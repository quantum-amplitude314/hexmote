import type {
  CanvasCreated,
  CanvasFrozen,
  CanvasUnfrozen,
  Cell,
  CellPainted,
  CreateCanvas,
  FreezeCanvas,
  HexCodeColor,
  PaintCell,
  UnfreezeCanvas,
} from "../src/index.ts";

export const red = "#e53935";
export const blue = "#1e88e5";
export const notInPalette = "#00ff00";
export const palette = [red, blue];

export const cellA = { axialQ: 0, axialR: 0 };
export const cellB = { axialQ: 1, axialR: 0 };
export const cellC = { axialQ: 0, axialR: 1 };
export const cellD = { axialQ: 1, axialR: 1 };
export const cellOutside = { axialQ: 9, axialR: 9 };

export const template = [
  { cell: cellA, color: red },
  { cell: cellB, color: red },
  { cell: cellC, color: blue },
  { cell: cellD, color: blue },
];

export const s1 = "s1";
export const s2 = "s2";

export const seconds = (count: number) => count * 1000;
export const t = Date.UTC(2026, 9, 21, 12);
export const cooldownMs = seconds(10);

export const canvasCreated: CanvasCreated = { type: "CanvasCreated", palette, template, at: t };
export const canvasFrozen: CanvasFrozen = { type: "CanvasFrozen", reason: "manual", at: t };
export const canvasUnfrozen: CanvasUnfrozen = { type: "CanvasUnfrozen", at: t };

export const cellPainted = ({
  cell,
  color,
  sessionId = s1,
  at = t,
}: {
  cell: Cell;
  color: HexCodeColor;
  sessionId?: string;
  at?: number;
}) => {
  const event: CellPainted = { type: "CellPainted", sessionId, cell, color, at };

  return event;
};

export const createCanvas: CreateCanvas = { type: "CreateCanvas", palette, template, at: t };
export const freezeCanvas: FreezeCanvas = { type: "FreezeCanvas", reason: "manual", at: t };
export const unfreezeCanvas: UnfreezeCanvas = { type: "UnfreezeCanvas", at: t };

export const paintCell = ({
  cell,
  color,
  sessionId = s1,
  at = t,
}: {
  cell: Cell;
  color: HexCodeColor;
  sessionId?: string;
  at?: number;
}) => {
  const command: PaintCell = { type: "PaintCell", sessionId, cell, color, at };

  return command;
};
