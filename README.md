# Hexmote

A shared hex canvas. Visitors paint one cell at a time to recreate a big emote together.
A CQRS and Event Sourcing PoC Demo Project.

https://hexmote.quantum-amplitude.tech

- [Event model](docs/EVENT-MODEL.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Glossary](docs/GLOSSARY.md)

## Run locally

```sh
cd apps/api && bun run dev                  # API on localhost:8787
curl -X POST localhost:8787/admin/canvas    # create the 😀 canvas
```
