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

Given  CanvasCreated, CanvasFrozen
When   PaintCell s1, A, red, t
Then   rejected: canvas frozen
```

## Slice 3: Freeze canvas

`FreezeCanvas {reason, at}` → `CanvasFrozen {reason, at}`

```
Given  CanvasCreated
When   FreezeCanvas
Then   CanvasFrozen

Given  CanvasCreated, CanvasFrozen
When   FreezeCanvas
Then   no events

Given  –
When   FreezeCanvas
Then   rejected: no canvas
```

## Slice 4: Unfreeze canvas

`UnfreezeCanvas {at}` → `CanvasUnfrozen {at}`

```
Given  CanvasCreated, CanvasFrozen
When   UnfreezeCanvas
Then   CanvasUnfrozen

Given  CanvasCreated
When   UnfreezeCanvas
Then   no events

Given  –
When   UnfreezeCanvas
Then   rejected: no canvas
```

## Slice 5: Canvas view

Every cell's current colour, completion and whether the canvas is open.

```
Given  CanvasCreated
Then   all cells blank, completion 0 %, open

Given  CanvasCreated, CellPainted A red, CellPainted C red
Then   A red, C red, completion 25 %

Given  CanvasCreated, CellPainted A red, CellPainted A blue
Then   A blue, completion 0 %   (last paint wins)

Given  CanvasCreated, CanvasFrozen
Then   frozen

Given  CanvasCreated, CanvasFrozen, CanvasUnfrozen
Then   open
```
