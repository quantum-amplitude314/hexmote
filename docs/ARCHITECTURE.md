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
browser ──────▶ web Worker (Next.js)  pages
browser ──▶ /api web Worker entry    ─service binding─▶ API Worker (Hono, oRPC) ─RPC─▶ Canvas Durable Object
browser ⇄ /live web Worker entry     ─service binding─▶ API Worker              ─────▶ Canvas Durable Object
admin   ──▶ /admin web Worker entry  ─service binding─▶ API Worker              ─RPC─▶ Canvas Durable Object
```

The API Worker has no public URL. `/api` and `/live` stay on the web host: first-party cookie, no
CORS. `next dev` has no web Worker: it rewrites `/api` to the API, and `/live` goes to the API directly.

Session: `GET /api/session` says who you are; without a session, Turnstile runs and
`POST /api/session` sets a signed cookie. `/live` and painting need it.

## Layers

| Package | Role |
|---|---|
| `packages/domain` | core: deciders and views, pure; laid out by slice, tests next to the code |
| `packages/application` | `handleCommand` and the `EventStore` port |
| `packages/template` | build time: emoji PNG → template cells and palette |
| `packages/contracts` | shared by api and web: live messages, the oRPC contract with Zod schemas |
| `apps/api` | adapters: Canvas Durable Object, SQLite event store; Hono routes `/live`, `/admin`, `/api` |
| `apps/web` | UI: Next.js with shadcn; paint on the live hex grid on `/`; `worker.ts` sends `/api`, `/live` and `/admin` to the API |

Dependencies point inward: api → application → domain.

## Canvas Durable Object

One canvas = one Durable Object = one event stream.

- Commands: read the stream, replay, decide, append at `expectedVersion` in one SQLite transaction
- No locks or deadlocks: the Durable Object runs one request at a time; `expectedVersion` is the backstop
- Read model: `CanvasView` in memory, updated right after each append, so never behind the stream
- `/live`: hibernatable WebSockets; on connect a snapshot and a welcome with the viewer's painter
  name, then one message per event; session ids and freeze reasons stay inside
- Heartbeat: `ping` every 25 s, answered by the runtime without waking the Canvas; after a drop or a
  missed pong the page reconnects (1 s, doubling to 30 s) and gets a fresh snapshot
- Presence: from the open WebSockets, not from events, so it is never stored
- Rounds: `CanvasCompleted` sets an alarm at `resetAt`; the alarm wipes the stream and records the
  old `CanvasCreated` again; during a budget freeze it retries hourly

## Testing

`bun test` for domain, application, template and the web's pure modules (fake timers for the live
connection); Vitest in workerd (`@cloudflare/vitest-plugin`) for the api, against the real Durable
Object. Components are checked in the browser.

## Template

😀 rendered locally from the Noto Color Emoji font to `packages/template/source/`. The template
samples the PNG at each hex centre: transparent centres are left out, the rest take the nearest
palette colour (the 16 colours of r/place 2017). `bun run generate` in `packages/template` writes
the JSON, which is committed.
