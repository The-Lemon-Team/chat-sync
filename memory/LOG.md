# Chat-Sync — Work Log

> **Актуальный лог.** Новые записи — **сверху**. Архив: [`history/2026-06/`](history/2026-06/)

---

## 2026-06-12 — Hub/Chat Account model + User auth

**Цель:** Разделить Hub TG-сессию и Chat Account как рабочие пространства; JWT-авторизация пользователей.

**Сделано (backend):**
- `User` model + migrations (`add_users`, `hub_chat_accounts`)
- `TelegramAccount.role`: `HUB` | `CHAT`; убрана старая иерархия `isHub`/`parentId`
- `ChatAccountSource`: `HUB_CLONE` | `CLEAN`; `hubSourceId`, `hubDetachedAt`
- `AuthModule` — register/login, JWT guard, `@CurrentUser()`
- `ChatAccountModule` — list/create, mass export из Hub с клонированием форков
- Hub API: `GET /telegram/hub`, `GET /telegram/hub/dialogs`
- Ownership checks через `OwnershipService`; scoped endpoints

**Сделано (frontend):**
- `AuthView` — login/register; `auth` store + JWT в API client
- `CreateChatAccountModal` — CLEAN или HUB_CLONE с выбором чатов Hub
- `TelegramAuthModal` — phone → code → 2FA для Hub
- `AppMenuSidebar`, theme/ui stores; account store refactor (hub + chatAccounts)
- Dexie schema v2: `role` вместо `isHub`

**Документация:**
- `hub-chat-accounts.mdc`, обновлены `project-overview`, `backend-nestjs`, `prisma-database`, `AGENTS.md`
- Kanban: User auth, Hub/Chat model, Chat Account UI, Telegram auth UI → Done

**Коммиты:** `6a744d4` (backend), `e7c2e6b` (frontend), `c771553` (docs)

**Следующий шаг:** Dexie offline polish, sync badge UI, POST /messages

---

## 2026-06-12 — Frontend + Safe Mode + API testing

**Цель:** Vue-приложение, безопасный режим, выборочный импорт чатов, smoke-тесты API.

**Сделано:**
- Scaffold `frontend/` (Vue 3, Vite, Pinia, Dexie, Tailwind, vue-advanced-chat)
- `OutboundGuard` + `useSafetyStore` — Safe Mode по умолчанию ON
- `AddChatModal` — ручной выбор чата (без bulk import)
- Backend: `GET /telegram/accounts`, `GET /telegram/accounts/:id/dialogs`
- Fix: `POST /chat-forks` → 404 при невалидном accountId
- `scripts/test-api.mjs` — smoke-тесты REST
- Обновлены `.cursor/rules/frontend-vue.mdc`, `AGENTS.md`

**Коммит:** `fb458ae` — Add Vue 3 frontend with Safe Mode and manual chat selection

**Следующий шаг:** Dexie offline polish, sync badge UI, auth UI

---

## 2026-06-11 — SyncService + ChatGateway + Cursor rules

**Цель:** Синхронизация сообщений, WebSocket, правила для AI.

**Сделано:**
- `SyncService` — история + медиа, cron для SCHEDULED
- `ChatGateway` — namespace `/chat`
- ChatFork REST API (`/chat-forks`, sync, messages)
- `.cursor/rules/*.mdc`, `AGENTS.md`

**Коммит:** `89c9560` — Add SyncService, ChatGateway, and Cursor AI rules

---

## 2026-06-10 — Backend foundation

**Цель:** Prisma, NestJS, GramJS auth, Docker, git repo.

**Сделано:**
- Prisma schema + migration `init`
- `TelegramManagerService` (auth flow)
- Docker Compose PostgreSQL
- Git: `git@github.com:The-Lemon-Team/chat-sync.git`

**Коммит:** `6a06fc2` — Initial backend foundation for chat-sync

**Примечание:** PostgreSQL перенесён на порт **5433** (конфликт с локальным PG на 5432)

---

*Ранние детали сессий 10–11.06 → см. [`history/2026-06/2026-06-10-12-foundation.md`](history/2026-06/2026-06-10-12-foundation.md)*
