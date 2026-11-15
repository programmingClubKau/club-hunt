# syntax=docker/dockerfile:1
FROM oven/bun:1.4-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/theme/package.json packages/theme/
RUN bun install --frozen-lockfile

FROM oven/bun:1.4-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cd apps/web && bun --bun run build

FROM oven/bun:1.4-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY packages ./packages
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY apps/web/package.json ./apps/web/package.json
COPY apps/web/serve.ts ./apps/web/serve.ts

WORKDIR /app/apps/web
EXPOSE 3080
CMD ["bun", "serve.ts"]
