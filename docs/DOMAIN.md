# Domain

## Canvas

- A grid of hex cells in axial coordinates `(q, r)`
- Has an emote template: the target colour of each cell
- A fixed palette of 16 colours
- Size, palette and template are fixed when the canvas is created; replaying `CellPainted` depends on them
- Open or frozen

## Command

`PaintCell {q, r, color}`, rejected when:

- the cell is outside the canvas
- the colour is not in the palette
- the session's cooldown has not passed
- the canvas is frozen

## Events

| Event | Payload |
|---|---|
| `CanvasCreated` | `size`, `palette`, `template`, `at` |
| `CellPainted` | `q`, `r`, `color`, `sessionId`, `at` |
| `CanvasFrozen` | `reason`, `at` |

## Read model

- Current colour of every cell
- Completion: share of cells that match the template
