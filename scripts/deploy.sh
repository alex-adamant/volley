#!/usr/bin/env bash
set -euo pipefail

echo "=== [$(date -Iseconds)] Deploy volley ==="

cd ~/apps/volley

echo "--- git status (before) ---"
git status -sb || true

echo "--- git pull ---"
git pull --ff-only

echo "--- docker compose config (syntax check) ---"
docker compose config >/dev/null

echo "--- docker compose build ---"
docker compose build

echo "--- prisma migrate deploy (one-off job using ui image) ---"
docker compose run --rm ui \
  npx prisma migrate deploy --schema packages/db/prisma/schema.prisma

echo "--- docker compose up (start services) ---"
docker compose up -d

echo "--- docker compose ps ---"
docker compose ps

echo "--- health summary ---"
docker compose ps --format 'table {{.Name}}\t{{.Service}}\t{{.Status}}'

echo "=== [$(date -Iseconds)] Deploy finished ==="
