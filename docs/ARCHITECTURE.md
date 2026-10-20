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

## Template

- Emoji from an open set, e.g. OpenMoji (CC BY-SA 4.0, attribution required)
- A script downsamples the image onto the hex grid and quantizes it to the palette
