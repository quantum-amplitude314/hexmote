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

## Event store

- Port `EventStore`: `read() → { events, version }` and `append({ events, expectedVersion })`
- Optimistic concurrency: `append` fails when the stream has moved past `expectedVersion`
- Adapters: Durable Object SQLite in the Worker, in memory for tests
- One canvas = one Durable Object = one stream
- SQLite table `events`: `version` (integer primary key), `type`, `payload` (JSON), `recorded_at`

## Testing

- `packages/domain`, `packages/application`: `bun test`
- `apps/api`: Vitest with `@cloudflare/vitest-pool-workers`, inside workerd, against the real
  Durable Object

## Template

- Emoji from an open set, e.g. OpenMoji (CC BY-SA 4.0, attribution required)
- A script downsamples the image onto the hex grid and quantizes it to the palette
