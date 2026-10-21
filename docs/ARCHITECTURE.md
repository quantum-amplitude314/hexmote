# Architecture

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Bun workspaces, Biome, tsc |
| Web | Next.js on Cloudflare Workers through OpenNext |
| API | Hono + oRPC contract |
| Canvas | One SQLite-backed Durable Object per canvas |
| Bot protection | Turnstile |

## Flow

```
browser ──────▶ web Worker (Next.js) ─service binding─▶ API Worker (Hono) ─RPC─▶ Canvas Durable Object
browser ⇄ /live web Worker entry     ─service binding─▶ API Worker        ─────▶ Canvas Durable Object
```

The API Worker has no public route. `/live` stays on the web host, so the session cookie is
first-party and no CORS is needed.

## Layers

| Package | Role |
|---|---|
| `packages/domain` | core: deciders and views, pure; laid out by slice, tests next to the code |
| `packages/application` | `handleCommand` and the `EventStore` port |
| `apps/api` | adapters: Canvas Durable Object, SQLite event store, `/live` |
| `apps/web` | UI |

Dependencies point inward: api → application → domain.

## Canvas Durable Object

One canvas = one Durable Object = one event stream.

- Commands: read the stream, replay, decide, append at `expectedVersion` in one SQLite transaction
- No locks or deadlocks: the Durable Object runs one request at a time; `expectedVersion` is the backstop
- Read model: `CanvasView` in memory, updated right after each append, so never behind the stream
- `/live`: hibernatable WebSockets, a snapshot on connect, then one message per event; session ids
  and freeze reasons stay inside

## Testing

`bun test` for domain and application; Vitest in workerd (`@cloudflare/vitest-plugin`) for the
api, against the real Durable Object.

## Template

OpenMoji emoji (CC BY-SA 4.0, attribution required), downsampled onto the hex grid and quantized
to the palette.
