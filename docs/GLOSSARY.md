# Glossary

## Canvas

| Term | Meaning | In code |
|---|---|---|
| Canvas | The shared hex grid visitors paint together | `Canvas` Durable Object |
| Cell | One hexagon, addressed by axial coordinates | `Cell { axialQ, axialR }` |
| Template | The emote: which cells exist and the target colour of each | `TemplateCell[]` |
| Palette | The colours a visitor can choose from | `HexCodeColor[]` |
| Session | An anonymous visitor, issued by the server after Turnstile | `sessionId` |
| Cooldown | Wait time between two paints of one session | `cooldownMs`, `COOLDOWN_MS` |
| Freeze | A hold that stops painting; holds can overlap, each lifted on its own | `FreezeReason`, `freezes` |
| Completion | Share of template cells painted in their target colour | `completionPercent` |

## CQRS and Event Sourcing

| Term | Meaning | In code |
|---|---|---|
| Command | An intent to change the canvas; it can be rejected | `CanvasCommand` |
| Event | A fact that happened, named in the past tense; never changed or deleted | `CanvasEvent` |
| Stream | All events of one canvas, in order | `StoredEvents.events` |
| Version | Number of events in the stream; an empty stream is at 0 | `StoredEvents.version` |
| Decider | Pure functions that decide on commands and apply events | `decide`, `evolve` |
| Decision | The outcome of a command: accepted with its events, or rejected | `Decision` |
| Rejection | Why a command was refused | `Rejection` |
| State | What the decider needs to enforce the rules; not shown to visitors | `CanvasState` |
| Replay | Rebuilding state by applying every event in order | `replay` |
| Projection, read model | A view built from the events, shaped for reading | `CanvasView` |
| Slice | One command or view with its specs, from the event model | `src/slices/*` |

## Architecture

| Term | Meaning | In code |
|---|---|---|
| Port | An interface the application owns and the outside implements | `EventStore` |
| Adapter | An implementation of a port for one technology | SQLite and in-memory event stores |
| Command handling | Read the stream, replay, decide, append | `handleCommand` |
| Optimistic concurrency | Append only if the stream is still at the version that was read | `expectedVersion`, `VersionConflictError` |
| Durable Object | A Cloudflare object with its own SQLite, handling one request at a time | `Canvas` |
