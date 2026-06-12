---
kanban-plugin: basic
---

## Backlog

- [ ] [[Hub search & subscribe]] — поиск групп/каналов через Hub TG API; подписка выполняется на Hub #backend
- [ ] [[Chat subscription request flow]] — Chat Account → запрос подписки → Hub выполняет join; статусы PENDING/SUBSCRIBED/FAILED #backend #frontend
- [ ] [[Hub deletion flow]] — при удалении Hub: hubDetachedAt, сохранить данные, отключить sync и поиск #backend
- [ ] [[POST /messages]] — backend endpoint отправки с server-side guard
- [ ] [[Session encryption]] — шифрование `sessionString` в БД
- [ ] [[Media viewer]] — просмотр скачанных медиа в UI
- [ ] [[E2E tests]] — интеграционные тесты с mock GramJS

## In Progress

- [ ] [[Dexie offline sync polish]] — merge remote ↔ local, conflict handling #frontend
- [ ] [[Sync badge styling]] — vue-advanced-chat индикаторы SYNCED / OFFLINE_ONLY #frontend

## Review

- [ ] [[API test coverage]] — расширить `test-api.mjs` (404, sync, dialogs, auth, chat-accounts)

## Done

- [x] [[User auth JWT]] — register/login, guards, scoped API #backend #frontend
- [x] [[Hub & Chat Account model]] — role HUB/CHAT, HUB_CLONE/CLEAN, clone API #backend #database
- [x] [[Chat Account UI]] — создание копии Hub или чистого аккаунта #frontend
- [x] [[Telegram auth UI]] — форма login Hub (phone → code → 2FA) #frontend
- [x] [[Prisma schema + migrations]] #database
- [x] [[Docker PostgreSQL :5433]] #infra
- [x] [[Telegram auth GramJS]] — `TelegramManagerService` #backend
- [x] [[SyncService]] — history + media download #backend
- [x] [[ChatGateway WebSocket]] — `/chat` namespace #backend
- [x] [[ChatFork REST API]] #backend
- [x] [[Dialogs API]] — manual chat pick #backend
- [x] [[Vue 3 frontend scaffold]] #frontend
- [x] [[Safe Mode / OutboundGuard]] — default ON #frontend
- [x] [[AddChatModal]] — no bulk import #frontend
- [x] [[Cursor rules + AGENTS.md]] #docs
- [x] [[Git repo setup]] — The-Lemon-Team/chat-sync

%% kanban:settings
```
{"kanban-plugin":"basic","list-collapse":[false,false,false,false]}
```
%%
