# Chat-Sync — Project Summary

> Последнее обновление: **2026-06-12**  
> Актуальный лог: [`LOG.md`](LOG.md) · Доска: [`kanban.md`](kanban.md)

## Миссия

Оффлайн-клиент Telegram и менеджер личных журналов. Не мессенджер для активного общения — **миграция чатов/каналов в автономные локальные форки**.

## Архитектура (текущая)

```
┌─────────────┐     REST / WS      ┌──────────────┐     GramJS      ┌──────────┐
│  Vue 3 SPA  │ ◄──────────────► │  NestJS API  │ ◄─────────────► │ Telegram │
│  Dexie IDB  │   /chat socket   │  Prisma + PG │   (Hub only)    │  MTProto │
└─────────────┘                  └──────────────┘                 └──────────┘
       │                                  │
       └──────── JWT auth ────────────────┘
```

## Модель аккаунтов

| Сущность | Роль | Описание |
|---|---|---|
| **User** | — | Владелец данных; email + JWT |
| **Hub Telegram Account** | `HUB` | Один на пользователя; GramJS-сессия; диалоги, подписка, источник контента |
| **Chat Account** | `CHAT` | Рабочее пространство (много); `HUB_CLONE` или `CLEAN`; без TG-сессии |
| **ChatFork** | — | Локальный форк чата/канала; привязан к **Chat Account** |

Подробнее: `.cursor/rules/hub-chat-accounts.mdc`

## Реализовано

| Область | Статус | Детали |
|---|---|---|
| Prisma schema | ✅ | User, TelegramAccount (HUB/CHAT), ChatFork, Message, MediaFile |
| Docker PostgreSQL | ✅ | Порт **5433** |
| User auth (JWT) | ✅ | register/login, guards, scoped API |
| Hub & Chat Account | ✅ | `role`, `source`, HUB_CLONE export, clone API |
| Telegram auth | ✅ | Hub only: SMS → код → 2FA |
| SyncService | ✅ | history + media, cron SCHEDULED |
| ChatGateway | ✅ | Socket.IO `/chat` |
| ChatFork API | ✅ | CRUD + sync; `accountId` = Chat Account |
| Dialogs API | ✅ | `GET /telegram/hub/dialogs` |
| Vue 3 frontend | ✅ | Pinia, Dexie v2, Tailwind, vue-advanced-chat |
| Auth UI | ✅ | login/register (`AuthView`) |
| Telegram auth UI | ✅ | phone → code → 2FA (`TelegramAuthModal`) |
| Chat Account UI | ✅ | CLEAN / HUB_CLONE (`CreateChatAccountModal`) |
| Safe Mode | ✅ | `OutboundGuard` — блок исходящих по умолчанию |
| Cursor rules | ✅ | `.cursor/rules/*.mdc`, `AGENTS.md` |
| Git | ✅ | `The-Lemon-Team/chat-sync`, branch `master` |

## Ключевые решения

- **Hub Telegram Account** (`role: HUB`) — единственная TG-сессия; источник контента и подписок
- **Chat Account** (`role: CHAT`) — все `ChatFork` создаются только здесь
- **SyncMode** на уровне чата: `LIVE` | `SCHEDULED` | `MANUAL` | `OFFLINE_ONLY`
- **Safe Mode ON** по умолчанию — сообщения не уходят в TG без явного разрешения
- Новые форки создаются с `syncMode: MANUAL`

## Запуск

```bash
# DB
cd backend && npm run db:up

# Backend (:3000)
cd backend && npm run start:dev

# Frontend (:5173, proxy /api → :3000)
cd frontend && npm run dev

# API smoke test
cd frontend && npm run test:api
```

## Коммиты (хронология)

| Дата | Hash | Описание |
|---|---|---|
| 10.06.26 | `6a06fc2` | Initial backend: Prisma, GramJS auth, Docker |
| 11.06.26 | `89c9560` | SyncService, ChatGateway, Cursor rules |
| 12.06.26 | `fb458ae` | Vue 3 frontend, Safe Mode, dialogs API |
| 12.06.26 | `6a744d4` | User auth JWT, Hub/Chat Account model |
| 12.06.26 | `e7c2e6b` | Auth UI, Chat Account UI, account refactor |
| 12.06.26 | `c771553` | Docs handoff: memory, cursor rules sync |

## Следующий фокус

1. Dexie — полная offline-синхронизация (merge, conflict handling)
2. UI — стилизация sync-бейджей в vue-advanced-chat
3. Backend `POST /messages` + guard на сервере
4. Hub search & subscribe, Chat subscription request flow

## Архив логов

- [`history/2026-06/2026-06-10-12-foundation.md`](history/2026-06/2026-06-10-12-foundation.md)
