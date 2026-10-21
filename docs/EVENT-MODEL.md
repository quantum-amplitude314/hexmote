# Event model

Commands write events, views read them. Each slice is one command or one view, specified as
Given (past events) – When (command) – Then (new events or a rejection).

## Timeline

```
admin    ── CreateCanvas   ──▶ CanvasCreated  ──┐
visitor  ── PaintCell      ──▶ CellPainted    ──┼──▶ Canvas view ──▶ canvas page, pushed live
admin    ── FreezeCanvas   ──▶ CanvasFrozen   ──┤
admin    ── UnfreezeCanvas ──▶ CanvasUnfrozen ──┘
```

## Spec fixtures

- Template: cells `A`, `B` red, cells `C`, `D` blue; `X` is not in the template
- Sessions `s1`, `s2`; time `t`; cooldown 10 s
- Freeze reasons `r1`, `r2`

## Slice 1: Create canvas

`CreateCanvas {palette, template, at}` → `CanvasCreated {palette, template, at}`

```
Given  –
When   CreateCanvas
Then   CanvasCreated

Given  CanvasCreated
When   CreateCanvas
Then   rejected: canvas exists

Given  –
When   CreateCanvas with a template colour not in the palette
Then   rejected: template colour not in palette
```

## Slice 2: Paint a cell

`PaintCell {sessionId, cell, color, at}` → `CellPainted {sessionId, cell, color, at}`

```
Given  CanvasCreated
When   PaintCell s1, A, red, t
Then   CellPainted s1, A, red, t

Given  –
When   PaintCell s1, A, red, t
Then   rejected: no canvas

Given  CanvasCreated
When   PaintCell s1, X, red, t
Then   rejected: cell outside canvas

Given  CanvasCreated
When   PaintCell s1, A, a colour not in the palette, t
Then   rejected: colour not in palette

Given  CanvasCreated, CellPainted s1, A, red, t
When   PaintCell s1, B, red, t + 5 s
Then   rejected: cooldown, retry at t + 10 s

Given  CanvasCreated, CellPainted s1, A, red, t
When   PaintCell s1, B, red, t + 10 s
Then   CellPainted s1, B, red, t + 10 s

Given  CanvasCreated, CellPainted s1, A, red, t
When   PaintCell s2, B, red, t + 5 s
Then   CellPainted s2, B, red, t + 5 s

Given  CanvasCreated, CanvasFrozen r1
When   PaintCell s1, A, red, t
Then   rejected: canvas frozen
```

## Slice 3: Freeze canvas

`FreezeCanvas {reason, at}` → `CanvasFrozen {reason, at}`

Freezes are holds that can overlap; each reason is frozen and lifted on its own.

```
Given  CanvasCreated
When   FreezeCanvas r1
Then   CanvasFrozen r1

Given  CanvasCreated, CanvasFrozen r1
When   FreezeCanvas r1
Then   no events

Given  CanvasCreated, CanvasFrozen r2
When   FreezeCanvas r1
Then   CanvasFrozen r1

Given  –
When   FreezeCanvas r1
Then   rejected: no canvas
```

## Slice 4: Unfreeze canvas

`UnfreezeCanvas {reason, at}` → `CanvasUnfrozen {reason, at}`

```
Given  CanvasCreated, CanvasFrozen r1
When   UnfreezeCanvas r1
Then   CanvasUnfrozen r1

Given  CanvasCreated
When   UnfreezeCanvas r1
Then   no events

Given  CanvasCreated, CanvasFrozen r2
When   UnfreezeCanvas r1
Then   no events

Given  CanvasCreated, CanvasFrozen r2, CanvasFrozen r1, CanvasUnfrozen r2
When   PaintCell s1, A, red, t
Then   rejected: canvas frozen

Given  –
When   UnfreezeCanvas r1
Then   rejected: no canvas
```

## Slice 5: Canvas view

Every cell's current colour, completion, whether the canvas is open, and the active freeze reasons.

```
Given  CanvasCreated
Then   all cells blank, completion 0 %, open

Given  CanvasCreated, CellPainted A red, CellPainted C red
Then   A red, C red, completion 25 %

Given  CanvasCreated, CellPainted A red, CellPainted A blue
Then   A blue, completion 0 %   (last paint wins)

Given  CanvasCreated, CanvasFrozen r1
Then   frozen

Given  CanvasCreated, CanvasFrozen r1, CanvasUnfrozen r1
Then   open

Given  CanvasCreated, CanvasFrozen r2, CanvasFrozen r1, CanvasUnfrozen r2
Then   frozen, active freezes: r1
```
