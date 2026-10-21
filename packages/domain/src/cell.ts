export type Cell = { axialQ: number; axialR: number };

export type HexCodeColor = string;

export type TemplateCell = { cell: Cell; color: HexCodeColor };

export const cellKey = ({ axialQ, axialR }: Cell) => `${axialQ},${axialR}`;
