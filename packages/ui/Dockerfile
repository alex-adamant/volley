# syntax=docker/dockerfile:1

# --- build stage ---
FROM node:24-bookworm-slim AS build
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY packages/ui/package*.json ./packages/ui/
COPY packages/db/package*.json ./packages/db/

# Install dependencies without running postinstall (cached unless package files change)
RUN npm ci --workspaces --include-workspace-root --ignore-scripts

# Copy source code
COPY packages ./packages

# Generate Prisma client and build
RUN npm run -w @volley/db generate
RUN npm run -w @volley/ui build

# --- runtime stage ---
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000

# copy only what's needed to run
COPY --from=build /app/packages/ui/build ./build
COPY --from=build /app/packages/ui/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/db/prisma ./packages/db/prisma

EXPOSE 3000
CMD ["node","build/index.js"]
