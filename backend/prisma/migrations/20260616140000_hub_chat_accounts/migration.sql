-- CreateEnum
CREATE TYPE "TelegramAccountRole" AS ENUM ('HUB', 'CHAT');
CREATE TYPE "ChatAccountSource" AS ENUM ('HUB_CLONE', 'CLEAN');

-- Add new columns
ALTER TABLE "telegram_accounts" ADD COLUMN "role" "TelegramAccountRole";
ALTER TABLE "telegram_accounts" ADD COLUMN "displayName" TEXT;
ALTER TABLE "telegram_accounts" ADD COLUMN "source" "ChatAccountSource";
ALTER TABLE "telegram_accounts" ADD COLUMN "hubDetachedAt" TIMESTAMP(3);
ALTER TABLE "telegram_accounts" ADD COLUMN "hubSourceId" TEXT;

-- Migrate isHub → role, parentId → hubSourceId
UPDATE "telegram_accounts" SET "role" = 'HUB' WHERE "isHub" = true;
UPDATE "telegram_accounts" SET "role" = 'CHAT' WHERE "isHub" = false;
UPDATE "telegram_accounts" SET "hubSourceId" = "parentId" WHERE "parentId" IS NOT NULL;

-- CHAT accounts without displayName get a default
UPDATE "telegram_accounts"
SET "displayName" = COALESCE("phone", 'Chat Account')
WHERE "role" = 'CHAT' AND "displayName" IS NULL;

-- Infer source for existing chat accounts
UPDATE "telegram_accounts"
SET "source" = 'HUB_CLONE'
WHERE "role" = 'CHAT' AND "hubSourceId" IS NOT NULL;

UPDATE "telegram_accounts"
SET "source" = 'CLEAN'
WHERE "role" = 'CHAT' AND "hubSourceId" IS NULL AND "source" IS NULL;

ALTER TABLE "telegram_accounts" ALTER COLUMN "role" SET NOT NULL;

-- HUB keeps phone/session; CHAT clears them
UPDATE "telegram_accounts" SET "phone" = NULL, "sessionString" = NULL WHERE "role" = 'CHAT';

-- Make phone/session nullable
ALTER TABLE "telegram_accounts" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "telegram_accounts" ALTER COLUMN "sessionString" DROP NOT NULL;

-- Drop old hierarchy
ALTER TABLE "telegram_accounts" DROP CONSTRAINT IF EXISTS "telegram_accounts_parentId_fkey";
DROP INDEX IF EXISTS "telegram_accounts_parentId_idx";
DROP INDEX IF EXISTS "telegram_accounts_isHub_idx";
ALTER TABLE "telegram_accounts" DROP COLUMN "parentId";
ALTER TABLE "telegram_accounts" DROP COLUMN "isHub";

-- New indexes and FK
CREATE INDEX "telegram_accounts_userId_role_idx" ON "telegram_accounts"("userId", "role");
CREATE INDEX "telegram_accounts_hubSourceId_idx" ON "telegram_accounts"("hubSourceId");
ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_hubSourceId_fkey" FOREIGN KEY ("hubSourceId") REFERENCES "telegram_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
