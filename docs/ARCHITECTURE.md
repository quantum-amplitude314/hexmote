# Architecture

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Bun workspaces, Turbo, Biome, tsc |
| Web | Next.js on Cloudflare Workers through OpenNext |
| API | Hono + oRPC contract |
| Canvas | One SQLite-backed Durable Object per canvas |
| Bot protection | Turnstile |

## Flow

```
browser ──────▶ web Worker (Next.js) ─service binding─▶ API Worker (Hono) ─RPC─▶ Canvas Durable Object
browser ⇄ /live web Worker entry     ─service binding─▶ API Worker        ─────▶ Canvas Durable Object
admin   ──▶ /admin web Worker entry  ─service binding─▶ API Worker        ─RPC─▶ Canvas Durable Object
```

The API Worker has no public URL (`workers_dev` and `preview_urls` off). `/live` stays on the web
host, so the session cookie is first-party and no CORS is needed.

## Layers

| Package | Role |
|---|---|
| `packages/domain` | core: deciders and views, pure; laid out by slice, tests next to the code |
| `packages/application` | `handleCommand` and the `EventStore` port |
| `packages/template` | build time: emoji PNG → template cells and palette |
| `packages/contracts` | types shared by api and web: live messages |
| `apps/api` | adapters: Canvas Durable Object, SQLite event store, `/live`, `/admin` |
| `apps/web` | UI: Next.js with shadcn; the live hex grid on `/`; `worker.ts` sends `/live` and `/admin/*` to the API |

Dependencies point inward: api → application → domain.

## Canvas Durable Object

One canvas = one Durable Object = one event stream.

- Commands: read the stream, replay, decide, append at `expectedVersion` in one SQLite transaction
- No locks or deadlocks: the Durable Object runs one request at a time; `expectedVersion` is the backstop
- Read model: `CanvasView` in memory, updated right after each append, so never behind the stream
- `/live`: hibernatable WebSockets, a snapshot on connect, then one message per event; session ids
  and freeze reasons stay inside

## Testing

`bun test` for domain, application, template and the web's pure functions (hex geometry, live
view); Vitest in workerd (`@cloudflare/vitest-plugin`) for the api, against the real Durable Object.

## Template

😀 rendered locally from the Noto Color Emoji font to `packages/template/source/`. The template
samples the PNG at each hex centre: transparent centres are left out, the rest take the nearest
palette colour (the 16 colours of r/place 2017). `bun run generate` in `packages/template` writes
the JSON, which is committed.
