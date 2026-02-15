# Local instructions

- Run `npm run -w @volley/ui lint` before reporting UI changes.
- Run `npm run -w @volley/ui check` to catch Svelte/TypeScript issues.
- use dash-case (e.g. trigger-group.svelte) for component names.
- Always use the latest svelte syntax.
- In tailwind use as much shortcuts as possible. Like size-4 instead of w-4 h-4; p-4 instead of px-4 py-4. 
- Don't use sizes like text-[0.6rem], use native tailwind sizes. As for specific values - just put them to the tailwind config.

## Project map

- Monorepo with npm workspaces:
  - `packages/bot`: Telegram bot on Telegraf + Express webhook endpoint.
  - `packages/ui`: SvelteKit 2 (Svelte 5 runes) web UI + admin panel.
  - `packages/db`: shared Prisma schema/client.
- Local DB for dev: `docker-compose.db.yml` (Postgres on `localhost:5433`).
- App runtime compose: `docker-compose.yml` (`ui` on 3000, `bot` on 4000, both wait for external `appnet` + db-wait helper).

## Useful commands

- Install deps: `npm ci`
- Prisma client: `npm run generate`
- Migrations:
  - dev: `npm run migrate:dev`
  - deploy: `npm run migrate:deploy`
- UI:
  - dev: `npm run -w @volley/ui dev`
  - check: `npm run -w @volley/ui check`
  - lint: `npm run -w @volley/ui lint`
  - build: `npm run -w @volley/ui build`
- Bot:
  - build: `npm run -w @volley/bot build`
  - start: `npm run -w @volley/bot start`

## Env and runtime notes

- Bot required env:
  - `TELEGRAM_TOKEN`
  - `REDIS_URL`
  - `PORT` (optional, default `4000`)
- DB env is from Prisma standard (`DATABASE_URL`, `DIRECT_URL`) in app env files.
- UI optional season fallback env:
  - `SEASON_START`
  - `SEASON_END`

## Bot behavior quick reference

- Entry: `packages/bot/src/index.ts`
- Session storage is Redis-backed (`packages/bot/src/utils/session.ts`) with 7-day TTL.
- Main commands:
  - `/m` - create single match (4 players, score flow, persists `Match`).
  - `/l` - create mini league for 4-7 players with inline dashboard + edits.
  - `/r` - overall rating.
  - `/rs` - season rating.
  - `/chat` - switch context chat for admin users.
  - `/ap` `/dp` - activate/deactivate players (admin only).
  - `/g` - generate text schedule for 4-8 players.
  - `/f` - random flip/ranking by score.
  - `/d` - Telegram dice.
- Chat-scoped checks are done via `requireChat`/`requireAdmin` middleware.

## UI behavior quick reference

- Data loading is server-side in `+page.server.ts` files under `packages/ui/src/routes/chat/[slug]/...`.
- Global layout loads chats for selector: `packages/ui/src/routes/+layout.server.ts`.
- Main pages:
  - players: `/chat/[slug]`
  - team stats: `/chat/[slug]/team-stats`
  - league stats: `/chat/[slug]/league-stats`
  - day results: `/chat/[slug]/day-results`
  - player profile: `/chat/[slug]/user/[userId]`
  - admin: `/chat/[slug]/admin`
- UI stores chosen league/range/status in `localStorage` keys `volley-*`.

## Admin panel notes

- Admin auth is independent from Telegram admin flag:
  - UI auth uses `AdminUser` + `AdminSession` tables and cookie `volley_admin_session`.
  - Telegram command permissions use `ChatUser.isAdmin`.
- Admin panel allows:
  - login/logout/create admin accounts
  - toggle player `isActive/isHidden/isAdmin`
  - CRUD seasons (+ active season switching)
  - edit/delete matches

## Data model essentials

- `ChatUser` is the key join model and stores per-chat status and initial rating/games.
- `Match` always stores four player ids, scores, day, league, and chat id.
- `Season` is per-chat with `isActive` marker; UI range selector is built from seasons first, env fallback second.

## Known gotchas

- Existing UI code currently contains many custom Tailwind sizes like `text-[0.6rem]`, despite local style rule above. Keep new changes aligned with the rule where possible, but expect legacy usage.
- UI tests are currently placeholder/outdated:
  - unit: trivial sum test (`src/index.test.ts`)
  - e2e: expects default Svelte heading (`tests/test.ts`), does not match current UI.
