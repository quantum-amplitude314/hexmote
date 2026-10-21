# Hexmote

A shared hex canvas. Visitors paint one cell at a time to recreate a big emote together.
A CQRS and Event Sourcing PoC Demo Project.

https://hexmote.quantum-amplitude.tech

- [Event model](docs/EVENT-MODEL.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Glossary](docs/GLOSSARY.md)

## Run locally

```sh
bun install
cp apps/web/.env.example apps/web/.env.development   # once
cp apps/web/wrangler.example.jsonc apps/web/wrangler.jsonc   # once, set your domain
bun run dev                                          # API on :8787, web on :3000
curl -X POST localhost:8787/admin/canvas             # create the 😀 canvas, once
```

Open http://localhost:3000, pick a colour and click a cell; the cooldown is 1 s locally. A private
window is a second painter: both appear online, and each sees the other's paints pulse with a name.

`bun run preview` runs the web Worker itself on :3000, so `/api`, `/live` and `/admin/*` go through
it to the API.
