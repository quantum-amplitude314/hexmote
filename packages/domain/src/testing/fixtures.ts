import type {
  CanvasCompleted,
  CanvasConfig,
  CanvasCreated,
  CanvasFrozen,
  CanvasUnfrozen,
  Cell,
  CellPainted,
  CreateCanvas,
  FreezeCanvas,
  FreezeReason,
  HexCodeColor,
  PaintCell,
  UnfreezeCanvas,
} from "../index.ts";

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
export const minutes = (count: number) => count * seconds(60);
export const t = Date.UTC(2026, 9, 21, 12);
export const cooldownMs = seconds(10);
export const resetAfterMs = minutes(60);
export const config: CanvasConfig = { cooldownMs, resetAfterMs };

export const canvasCreated: CanvasCreated = { type: "CanvasCreated", palette, template, at: t };
export const canvasFrozen = ({ reason = "manual" }: { reason?: FreezeReason } = {}) => {
  const event: CanvasFrozen = { type: "CanvasFrozen", reason, at: t };

  return event;
};

export const canvasUnfrozen = ({ reason = "manual" }: { reason?: FreezeReason } = {}) => {
  const event: CanvasUnfrozen = { type: "CanvasUnfrozen", reason, at: t };

  return event;
};

export const canvasCompleted = ({ at = t }: { at?: number } = {}) => {
  const event: CanvasCompleted = { type: "CanvasCompleted", at, resetAt: at + resetAfterMs };

  return event;
};

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
export const freezeCanvas = ({ reason = "manual" }: { reason?: FreezeReason } = {}) => {
  const command: FreezeCanvas = { type: "FreezeCanvas", reason, at: t };

  return command;
};

export const unfreezeCanvas = ({ reason = "manual" }: { reason?: FreezeReason } = {}) => {
  const command: UnfreezeCanvas = { type: "UnfreezeCanvas", reason, at: t };

  return command;
};

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
