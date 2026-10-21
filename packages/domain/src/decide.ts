import type { CanvasState } from "./canvas/canvas-state.ts";
import type { CanvasCommand } from "./canvas/commands.ts";
import { decideCreateCanvas } from "./slices/create-canvas/create-canvas.ts";
import { decideFreezeCanvas } from "./slices/freeze-canvas/freeze-canvas.ts";
import { decidePaintCell } from "./slices/paint-cell/paint-cell.ts";
import { decideUnfreezeCanvas } from "./slices/unfreeze-canvas/unfreeze-canvas.ts";

/** Routes each command to its slice. */
export const decide = ({
  state,
  command,
  cooldownMs,
}: {
  state: CanvasState;
  command: CanvasCommand;
  cooldownMs: number;
}) => {
  switch (command.type) {
    case "CreateCanvas":
      return decideCreateCanvas({ state, command });
    case "PaintCell":
      return decidePaintCell({ state, command, cooldownMs });
    case "FreezeCanvas":
      return decideFreezeCanvas({ state, command });
    case "UnfreezeCanvas":
      return decideUnfreezeCanvas({ state, command });
    default:
      return command satisfies never;
  }
};
