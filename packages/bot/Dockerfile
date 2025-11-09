# syntax=docker/dockerfile:1

# --- build stage ---
FROM node:24-bookworm-slim AS build
WORKDIR /app

# 1️⃣ Copy manifests for workspace install
COPY package*.json ./
COPY packages/bot/package*.json ./packages/bot/
COPY packages/db/package*.json ./packages/db/

# 2️⃣ Install dependencies (cached unless manifests change)
RUN npm ci --workspaces --include-workspace-root --ignore-scripts

# 3️⃣ Copy full source
COPY packages ./packages

# 4️⃣ Generate Prisma client using shared schema
RUN npm run -w @volley/db generate

# 5️⃣ Build the bot (TypeScript → JS)
RUN npm run -w @volley/bot build

# --- runtime stage ---
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=4000

# Copy Prisma client (so runtime has @prisma/client + generated code)
COPY --from=build /app/packages/db/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/packages/bot/dist ./dist
COPY --from=build /app/packages/bot/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "dist/index.js"]
