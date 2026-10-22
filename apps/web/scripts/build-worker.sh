#!/bin/sh
set -eu

bun run opennextjs-cloudflare build "$@"

for route in robots.txt sitemap.xml; do
  command cp ".next/server/app/$route.body" ".open-next/assets/$route"
done
