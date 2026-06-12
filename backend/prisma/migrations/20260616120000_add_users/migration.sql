-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Default user for existing Telegram accounts (change password after first login)
INSERT INTO "users" ("id", "email", "passwordHash", "name", "createdAt", "updatedAt")
VALUES (
    'legacy-migration-user',
    'legacy@chat-sync.local',
    '$2b$10$placeholder_hash_change_on_register',
    'Legacy User',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Add userId column (nullable first for backfill)
ALTER TABLE "telegram_accounts" ADD COLUMN "userId" TEXT;

UPDATE "telegram_accounts" SET "userId" = 'legacy-migration-user' WHERE "userId" IS NULL;

ALTER TABLE "telegram_accounts" ALTER COLUMN "userId" SET NOT NULL;

-- Drop old global phone unique constraint
DROP INDEX "telegram_accounts_phone_key";

-- CreateIndex
CREATE INDEX "telegram_accounts_userId_idx" ON "telegram_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_userId_phone_key" ON "telegram_accounts"("userId", "phone");

-- AddForeignKey
ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
