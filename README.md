# club-hunt

A treasure hunt you can run in an afternoon. Organizers build a trail in the browser, print the QR stickers, and teams walk it stop by stop on their phones.

![runtime](https://img.shields.io/badge/runtime-Bun%201.4-black?logo=bun)
![ui](https://img.shields.io/badge/ui-TanStack%20Start%20%2B%20React%2019-f472b6)
![api](https://img.shields.io/badge/api-Fastify%205-f472b6)
![db](https://img.shields.io/badge/db-PostgreSQL%2018%20%2B%20Prisma-336791?logo=postgresql)
![tests](https://img.shields.io/badge/tests-15%20passing-brightgreen)
![status](https://img.shields.io/badge/status-ready%20for%20an%20event-blue)

## The idea

A team taps its section, gets a trail, and reads a riddle. They walk to the place the riddle describes, scan the sticker on the wall, and the next riddle appears. The last scan ends the hunt and prints a winner badge they can show at the booth to collect the prize.

A trail is a pool of spots, not a fixed path. A pool of 12 spots with 3 per team gives 220 combinations, and each team also gets its own order, so two teams almost never walk the same route. The men's and women's sections are separate because the buildings are separate, and their results never mix.

## What it does not do

No player accounts, no GPS tracking, no photo uploads, no push notifications. No payments or scoring beyond completion time. It is meant to survive a crowded campus and a flaky network, so it does the small set of things it needs and nothing else.

## How it plays

1. Player picks بنين or بنات, picks solo or a team, enters a name.
2. The server assigns a random open trail and deals that team its stops.
3. Riddle one shows. The player scans the sticker at the location.
4. Correct scan unlocks riddle two, and so on.
5. The final scan mints a claim code and shows the winner badge.
6. Staff scan the badge QR at the booth, see "الفوز مؤكد", and mark the prize collected.

## How it is put together

```
apps/web        TanStack Start (React 19, Vite 8), server rendered, port 3080
apps/api        Fastify 5, one file per endpoint, port 8794
packages/db     Prisma schema, client and seed
packages/theme  brand tokens used by both apps
```

Bun workspaces, one lockfile. The browser only ever talks to the web app. Every page load and every action goes through a server function that forwards the cookie to Fastify and relays `Set-Cookie` back, so the API stays stateless and both cookies (player, organizer) live on the web origin.

## Running it locally

```bash
docker compose up -d      # PostgreSQL 18 on 5433
bun install
bun run db:migrate
bun run db:seed
bun run dev:api           # http://127.0.0.1:8794
bun run dev:web           # http://127.0.0.1:3080
```

Organizer console lives at `/admin/login`. The password comes from `ADMIN_PASSWORD`, which defaults to `progg-hunt` and should not stay that way.

| Variable | Where | What it is |
| --- | --- | --- |
| `DATABASE_URL` | `apps/api/.env`, `packages/db/.env` | Postgres connection string |
| `ADMIN_PASSWORD` | `apps/api/.env` | Shared organizer password |
| `COOKIE_SECRET` | `apps/api/.env` | Signs the session and admin cookies |
| `PORT` | `apps/api/.env` | API port, 8794 by default |
| `API_URL` | `apps/web/.env` | Where the web app reaches the API |

Ports 3000, 3001, 3010, 3011, 3040, 3060 and 3070 are already used on the shared host, which is why this project sits on 3080 and 8794.

## Deploying

Both apps ship as Docker images built from the repo root, so the workspace resolves normally. `docker compose -f docker-compose.prod.yml up -d --build` runs the web app, the API and Postgres together, applying migrations on boot.

On Coolify the project is `club-hunt` in the Programming Club project, served at `hunt.progg.club`.

## Setting up an event

1. Open `/admin/settings` and set the public base URL to the address phones will actually use. Every printed QR bakes that address in, so set it before printing anything.
2. Create one trail per section. Open it.
3. Add the spots to the pool. Set "spots per team" to 3 for a 12 spot trail.
4. Print the sticker sheet for that trail, cut, and post them.
5. Leave trails in `draft` until the stickers are on the walls, then switch them to `open`.

## Pages

| Path | Who | What |
| --- | --- | --- |
| `/` | player | Section choice, join a team, leaderboard |
| `/t/:section` | player | Assigns a random open trail and redirects |
| `/start/:routeId` | player | Solo or team setup |
| `/h` | player | Current riddle, progress, team code |
| `/s/:token` | player | Scan landing, resolves a sticker |
| `/c` | player | Manual code entry |
| `/join` | player | A second phone joins with a team code |
| `/board` | player | Results per trail |
| `/v/:code` | organizer | Booth check for a winner badge |
| `/admin` | organizer | Trails, counts, status |
| `/admin/routes/:id` | organizer | Spots, add, reorder, status |
| `/admin/stickers/:id` | organizer | Printable sticker sheet |
| `/admin/sessions/:id` | organizer | Live console, force step, reset, mark test |
| `/admin/settings` | organizer | Public base URL |

## API

Public: `GET /health`, `GET /routes/:section/assign`, `GET /routes/:id/public`, `POST /sessions`, `GET /sessions/me`, `GET /scan/:code`, `POST /scan`, `POST /join`, `GET /board`, `GET /leaderboard/:routeId`, `GET /verify/:code`, `GET /qr.svg`.

Organizer, behind the `adm` cookie: login and logout, route and poster CRUD, token rotation, reorder, sticker QR files, session list and actions, redemption, CSV export, settings.

Every endpoint is one file in `apps/api/routes/`, loaded by `tools/loadRoutes.ts`, with the shared types in `src/types/globals.d.ts` so a route file needs no imports.

## Tests

```bash
bun run test
```

Fifteen tests against a real Postgres database. They cover trail assignment, session creation and cookie signing, the pool cap, distinct stops per team, different paths for different teams, that only the current riddle is ever in a payload, out of order refusal, idempotent rescans, the typed code path, a second phone joining as its own device, device revocation, a full run minting a valid claim, unknown claim codes, single use redemption, organizer auth, draft invisibility, and QR generation. The suite cleans its own rows and puts the base URL back.

## The decisions that matter

**Riddles live on the server.** Only the current stop is ever in a response. Reading the page source gets you nothing.

**Stickers are permanent.** Each sticker is one opaque token at `/s/<token>`, good for every team and every event until you regenerate it. The order lives in the database, so one print run serves everyone.

**Randomness is per team.** Each session draws its own spots and shuffles them. Changing "spots per team" affects new sessions only, and teams already walking keep the path they were dealt.

**Finishing mints a claim code.** The last scan writes an 8 character code and the finish screen becomes a badge. Redeeming stamps the session, and a second attempt is refused, so a screenshot of an old badge cannot be cashed twice.

**One device token per phone.** The cookie never holds the team credential. Every phone gets its own token, revoking one leaves the others alone, and a dead phone costs a rejoin with the team code.

**One password.** Organizer auth is a shared password and a signed cookie. For a two hour event that is the right amount of machinery.

## Where it goes next

Organizer accounts instead of one shared password, media on a stop, a camera scanner inside the page, and a printable answer sheet for staff.

---

Programming Club, King Abdulaziz University.
