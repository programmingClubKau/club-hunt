-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "claim_code" TEXT,
ADD COLUMN     "redeemed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "session_id" INTEGER NOT NULL,
    "ua" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_token_key" ON "devices"("token");

-- CreateIndex
CREATE INDEX "devices_session_id_idx" ON "devices"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_claim_code_key" ON "sessions"("claim_code");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

