# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /app

# copy all workspace manifests
COPY package*.json ./
COPY packages ./packages

RUN npm ci --workspaces
RUN npm --workspace @volley/ui run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/packages/ui/build ./build
COPY --from=build /app/packages/ui/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "build"]
