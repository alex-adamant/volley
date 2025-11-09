# syntax=docker/dockerfile:1

# --- build stage ---
FROM node:24-bookworm-slim AS build
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY packages/ui/package*.json ./packages/ui/
COPY packages/db/package*.json ./packages/db/

# Install dependencies (cached unless package files change)
RUN npm ci --workspaces --include-workspace-root

# Copy source code
COPY packages ./packages

# Build application
RUN npm run -w @volley/ui build

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
