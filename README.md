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
bun run dev                                          # API on :8787, web on :3000
curl -X POST localhost:8787/admin/canvas             # create the 😀 canvas, once
```

Open http://localhost:3000.
