# syntax=docker/dockerfile:1

# --- build stage ---
FROM node:24-bookworm-slim AS build
WORKDIR /app

# 1) Copy root manifests first (must include workspaces + lockfile)
COPY package.json package-lock.json ./

# 2) Copy workspace manifests only (for better caching)
COPY packages/ui/package.json packages/ui/package.json
COPY packages/db/package.json packages/db/package.json

# 3) Install all workspace deps (root + workspaces)
RUN npm ci --workspaces --include-workspace-root

# 4) Copy sources after deps are cached
COPY packages/db/prisma packages/db/prisma
COPY packages/ui packages/ui

# 5) Generate Prisma client for UI and build
RUN npm --workspace @volley/ui run postinstall
RUN npm --workspace @volley/ui run build

# --- runtime stage ---
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000

# copy only what's needed to run
COPY --from=build /app/packages/ui/build ./build
COPY --from=build /app/packages/ui/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node","build/index.js"] 
