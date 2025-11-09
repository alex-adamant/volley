# syntax=docker/dockerfile:1

# --- build stage ---
FROM node:24-bookworm-slim AS build
WORKDIR /app

# 1) copy manifests for better layer caching
COPY package*.json ./
COPY packages/*/package*.json ./packages/

# 2) install all workspaces deps
RUN npm ci --workspaces

# 3) copy sources (now that deps are cached)
COPY packages ./packages

# 4) build the UI workspace (assumes your scripts are set correctly)
RUN npm --workspace @volley/ui run build

# --- runtime stage ---
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000

# copy only what’s needed to run
COPY --from=build /app/packages/ui/build ./build
COPY --from=build /app/packages/ui/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node","build/index.js"]

