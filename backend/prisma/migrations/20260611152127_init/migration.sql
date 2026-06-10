-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('SAVED_MESSAGES', 'GROUP', 'CHANNEL', 'OFFLINE_JOURNAL');

-- CreateEnum
CREATE TYPE "ChatSyncMode" AS ENUM ('LIVE', 'SCHEDULED', 'MANUAL', 'OFFLINE_ONLY');

-- CreateEnum
CREATE TYPE "MessageSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'OFFLINE_ONLY');

-- CreateTable
CREATE TABLE "telegram_accounts" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "sessionString" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHub" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "telegram_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_forks" (
    "id" TEXT NOT NULL,
    "telegramChatId" TEXT,
    "title" TEXT NOT NULL,
    "type" "ChatType" NOT NULL,
    "syncMode" "ChatSyncMode" NOT NULL DEFAULT 'MANUAL',
    "syncInterval" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "chat_forks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "localId" UUID NOT NULL,
    "telegramMessageId" BIGINT,
    "text" TEXT NOT NULL,
    "syncStatus" "MessageSyncStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chatForkId" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" TEXT NOT NULL,
    "localPath" TEXT NOT NULL,
    "telegramFileId" TEXT,
    "mimeType" TEXT,
    "fileSize" BIGINT,
    "messageId" TEXT NOT NULL,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_accounts_phone_key" ON "telegram_accounts"("phone");

-- CreateIndex
CREATE INDEX "telegram_accounts_parentId_idx" ON "telegram_accounts"("parentId");

-- CreateIndex
CREATE INDEX "telegram_accounts_isHub_idx" ON "telegram_accounts"("isHub");

-- CreateIndex
CREATE INDEX "chat_forks_accountId_idx" ON "chat_forks"("accountId");

-- CreateIndex
CREATE INDEX "chat_forks_syncMode_idx" ON "chat_forks"("syncMode");

-- CreateIndex
CREATE UNIQUE INDEX "chat_forks_accountId_telegramChatId_key" ON "chat_forks"("accountId", "telegramChatId");

-- CreateIndex
CREATE INDEX "messages_chatForkId_createdAt_idx" ON "messages"("chatForkId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_syncStatus_idx" ON "messages"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "messages_chatForkId_localId_key" ON "messages"("chatForkId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_chatForkId_telegramMessageId_key" ON "messages"("chatForkId", "telegramMessageId");

-- CreateIndex
CREATE INDEX "media_files_messageId_idx" ON "media_files"("messageId");

-- AddForeignKey
ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "telegram_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_forks" ADD CONSTRAINT "chat_forks_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "telegram_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatForkId_fkey" FOREIGN KEY ("chatForkId") REFERENCES "chat_forks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
