# Domain

Slices and their specs: [EVENT-MODEL.md](EVENT-MODEL.md).

## Canvas

- Hex cells in axial coordinates `(q, r)`
- The emote template decides which cells exist (the emote's silhouette, about 40 cells across)
  and the target colour of each
- A fixed palette of 16 colours
- Palette and template are fixed when the canvas is created; replaying `CellPainted` depends on them
- The cooldown length is configuration, not history: changing it never changes past events
- Open or frozen

## Commands

| Command | Payload | Rejected when |
|---|---|---|
| `CreateCanvas` | `palette`, `template`, `at` | the canvas exists; a template colour is not in the palette |
| `PaintCell` | `sessionId`, `cell`, `color`, `at` | no canvas; the cell is not in the template; the colour is not in the palette; the session's cooldown has not passed; the canvas is frozen |
| `FreezeCanvas` | `reason`, `at` | no canvas; already frozen gives no event |
| `UnfreezeCanvas` | `at` | no canvas; already open gives no event |

`sessionId` and `at` come from the server, never from the client.

## Events

| Event | Payload |
|---|---|
| `CanvasCreated` | `palette`, `template`, `at` |
| `CellPainted` | `sessionId`, `cell`, `color`, `at` |
| `CanvasFrozen` | `reason`, `at` |
| `CanvasUnfrozen` | `at` |

## Read model

- Current colour of every cell; the last paint wins
- Completion: share of template cells painted in their target colour
- Open or frozen
