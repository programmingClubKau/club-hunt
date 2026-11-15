-- CreateEnum
CREATE TYPE "Section" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('draft', 'open', 'closed');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('solo', 'team');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'finished');

-- CreateTable
CREATE TABLE "routes" (
    "id" SERIAL NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL DEFAULT '',
    "section" "Section" NOT NULL,
    "status" "RouteStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posters" (
    "id" SERIAL NOT NULL,
    "route_id" INTEGER NOT NULL,
    "name_ar" TEXT NOT NULL DEFAULT '',
    "name_en" TEXT NOT NULL DEFAULT '',
    "riddle_ar" TEXT NOT NULL DEFAULT '',
    "riddle_en" TEXT NOT NULL DEFAULT '',
    "token" TEXT NOT NULL,
    "human_code" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "route_id" INTEGER NOT NULL,
    "section" "Section" NOT NULL,
    "mode" "SessionMode" NOT NULL DEFAULT 'team',
    "name" TEXT NOT NULL,
    "join_code" TEXT NOT NULL,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "duration_ms" INTEGER,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_steps" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "step_no" INTEGER NOT NULL,
    "poster_id" INTEGER NOT NULL,
    "scanned_at" TIMESTAMP(3),

    CONSTRAINT "session_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER,
    "poster_id" INTEGER,
    "token" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL DEFAULT '',
    "ua" TEXT NOT NULL DEFAULT '',
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "posters_token_key" ON "posters"("token");

-- CreateIndex
CREATE INDEX "posters_route_id_seq_idx" ON "posters"("route_id", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_code_key" ON "sessions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_join_code_key" ON "sessions"("join_code");

-- CreateIndex
CREATE INDEX "sessions_route_id_status_idx" ON "sessions"("route_id", "status");

-- CreateIndex
CREATE INDEX "session_steps_session_id_step_no_idx" ON "session_steps"("session_id", "step_no");

-- CreateIndex
CREATE UNIQUE INDEX "session_steps_session_id_step_no_key" ON "session_steps"("session_id", "step_no");

-- CreateIndex
CREATE INDEX "scans_session_id_idx" ON "scans"("session_id");

-- AddForeignKey
ALTER TABLE "posters" ADD CONSTRAINT "posters_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_steps" ADD CONSTRAINT "session_steps_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_steps" ADD CONSTRAINT "session_steps_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "posters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "posters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
