# Event model

Commands write events, views read them. One slice is one command or one view; its
Given-When-Then specs are the tests next to it in `packages/domain/src/slices/`.

## Timeline

```
admin    ── CreateCanvas   ──▶ CanvasCreated  ──┐
visitor  ── PaintCell      ──▶ CellPainted    ──┼──▶ Canvas view ──▶ canvas page, pushed live
admin    ── FreezeCanvas   ──▶ CanvasFrozen   ──┤
admin    ── UnfreezeCanvas ──▶ CanvasUnfrozen ──┘
```

## Rules

- Hex cells in axial coordinates; the emote template decides which cells exist and their target colour
- Palette and template are fixed in `CanvasCreated`; the cooldown is configuration, not history
- Freezes are holds that can overlap: each reason is frozen and lifted on its own
- `sessionId` and `at` are set by the server, never by the client

## Slices

| Slice | Command → event | Rejected when |
|---|---|---|
| 1 Create canvas | `CreateCanvas` → `CanvasCreated` | canvas exists; template colour not in the palette |
| 2 Paint a cell | `PaintCell` → `CellPainted` | no canvas; frozen; cell not in the template; colour not in the palette; cooldown |
| 3 Freeze | `FreezeCanvas` → `CanvasFrozen` | no canvas; a reason already active gives no event |
| 4 Unfreeze | `UnfreezeCanvas` → `CanvasUnfrozen` | no canvas; a reason not active gives no event |
| 5 Canvas view | all events → `CanvasView` | – |

## Canvas view

- Target and current colour of every cell; the last paint wins
- Completion: share of cells in their target colour, rounded down
- Open or frozen with the active reasons; the public view drops the reasons
