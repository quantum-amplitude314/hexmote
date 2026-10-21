# Event model

Commands write events, views read them. One slice is one command or one view; its
Given-When-Then specs are the tests next to it in `packages/domain/src/slices/`.

## Timeline

```
admin    ── CreateCanvas   ──▶ CanvasCreated   ──┐
visitor  ── PaintCell      ──▶ CellPainted     ──┤
                               CanvasCompleted ──┼──▶ Canvas view ──▶ canvas page, pushed live
admin    ── FreezeCanvas   ──▶ CanvasFrozen    ──┤
admin    ── UnfreezeCanvas ──▶ CanvasUnfrozen  ──┘
```

## Rules

- Hex cells in axial coordinates; the emote template decides which cells exist; its colours are
  inspiration, any palette colour goes anywhere
- Palette and template are fixed in `CanvasCreated`; cooldown and reset delay are configuration
- The paint that fills the last blank cell also records `CanvasCompleted { resetAt }`; a completed
  canvas takes no paints
- A new round at `resetAt`, or on admin reset: the stream is wiped and `CanvasCreated` recorded
  again with the same emote; it waits while the budget freeze is active
- Freezes are holds that can overlap: each reason is frozen and lifted on its own
- `sessionId` and `at` are set by the server, never by the client
- Deleting a canvas is not a command: it wipes the stream, so `CreateCanvas` can start over

## Slices

| Slice | Command → event | Rejected when |
|---|---|---|
| 1 Create canvas | `CreateCanvas` → `CanvasCreated` | canvas exists; template colour not in the palette |
| 2 Paint a cell | `PaintCell` → `CellPainted`, + `CanvasCompleted` on the last blank cell | no canvas; frozen; completed; cell not in the template; colour not in the palette; cooldown |
| 3 Freeze | `FreezeCanvas` → `CanvasFrozen` | no canvas; a reason already active gives no event |
| 4 Unfreeze | `UnfreezeCanvas` → `CanvasUnfrozen` | no canvas; a reason not active gives no event |
| 5 Canvas view | all events → `CanvasView` | – |

## Canvas view

- Target and current colour of every cell; the last paint wins
- Painted: share of painted cells, any colour, one decimal, rounded down
- Open, frozen with the active reasons, or completed with `resetAt`; a freeze shows over completion;
  the public view drops the reasons
