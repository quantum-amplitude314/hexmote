# Architecture

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Bun workspaces, Biome, tsc |
| Web | Next.js on Cloudflare Workers through OpenNext |
| API | Hono + oRPC contract |
| Canvas | One SQLite-backed Durable Object: command handler, event store, read model, WebSocket broadcast |
| Bot protection | Turnstile |

## Flow

```
browser → web Worker (Next.js) ─service binding→ API Worker (Hono) → canvas Durable Object → SQLite events
browser ⇄ /live (web Worker entry, ahead of OpenNext) ─service binding→ API Worker → canvas Durable Object
```

- The API Worker has no public route; the web Worker reaches it through a service binding
- `/live` upgrades to a WebSocket on the web host and is forwarded over the same binding,
  so the session cookie stays first-party and no CORS is needed
- The canvas Durable Object accepts WebSockets with the hibernation API

## Layers

| Package | Hexagonal role |
|---|---|
| `packages/domain` | core: deciders, `evolve`, views; pure, no IO |
| `packages/application` | application: `handleCommand` and the `EventStore` port |
| `apps/api` | adapters: Durable Object SQLite event store, Hono routes, WebSocket |
| `apps/web` | UI |

## Command handling

```
command → handleCommand: read events → replay → decide → append if accepted → Decision
```

- The canvas Durable Object exposes `handleCommand(command)` over RPC through the `CANVAS` binding
- Cooldown comes from the `COOLDOWN_MS` var

## Event store

- Port `EventStore`: `read() → { events, version }` and `append({ events, expectedVersion })`
- Optimistic concurrency: `append` fails when the stream has moved past `expectedVersion`
- `append` runs in one SQLite transaction (`transactionSync`): a conflict or a failed insert rolls
  back every row
- No locks or deadlocks: the Durable Object handles one request at a time, and `handleCommand` does
  no outside IO between read and append; `expectedVersion` is the backstop
- Adapters: Durable Object SQLite in the Worker, in memory for tests
- One canvas = one Durable Object = one stream
- SQLite table `events`: `version` (integer primary key), `type`, `payload` (JSON), `recorded_at`

## Testing

- `packages/domain`, `packages/application`: `bun test`
- `apps/api`: Vitest with `@cloudflare/vitest-plugin`, inside workerd, against the real
  Durable Object; storage is isolated per test file, so each test uses a new canvas id

## Template

- Emoji from an open set, e.g. OpenMoji (CC BY-SA 4.0, attribution required)
- A script downsamples the image onto the hex grid and quantizes it to the palette
