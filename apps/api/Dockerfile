# syntax=docker/dockerfile:1
FROM oven/bun:1.4-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/theme/package.json packages/theme/
RUN bun install --frozen-lockfile

COPY . .
# Generated inside the image so the Prisma query engine matches musl.
RUN cd packages/db && bunx prisma generate

FROM oven/bun:1.4-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 8794
# Migrations run first so a fresh database is ready before the API answers.
CMD ["sh", "-c", "cd /app/packages/db && bunx prisma migrate deploy && cd /app/apps/api && bun src/server.ts"]
