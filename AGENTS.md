# AGENTS.md — Chat-Sync

## Project
Offline Telegram client and personal journal manager. Hub account pulls TG content into local forks for autonomous offline use.

> **Memory:** logs → [`memory/LOG.md`](memory/LOG.md) · summary → [`memory/SUMMARY.md`](memory/SUMMARY.md) · kanban → [`memory/kanban.md`](memory/kanban.md)

## Agent Roles

### Backend Agent
- NestJS modules in `backend/src/`
- GramJS for MTProto (user sessions, not bots)
- Prisma for PostgreSQL persistence
- WebSocket via `ChatGateway` namespace `/chat`

### Frontend Agent
- Vue 3 SPA in `frontend/`
- Dexie.js for offline IndexedDB cache
- Pinia stores sync with backend REST + WebSocket
- `vue-advanced-chat` wrapper with sync status indicators
- Safe Mode: all outbound via `OutboundGuard`

### Database Agent
- Schema changes via `backend/prisma/schema.prisma`
- Always create migrations: `npx prisma migrate dev`
- Docker PostgreSQL on port 5433

## Current Status
- [x] Prisma schema + migrations
- [x] User auth (JWT register/login)
- [x] Hub & Chat Account model (HUB/CHAT, HUB_CLONE/CLEAN)
- [x] Telegram auth (GramJS) — Hub only
- [x] SyncService + ChatGateway
- [x] ChatFork REST API
- [x] Vue 3 frontend (Safe Mode, manual chat pick)
- [x] Auth UI (login/register) + Telegram auth UI (Hub)
- [x] Chat Account UI (CLEAN / HUB_CLONE export)
- [ ] Dexie full offline sync polish
- [ ] vue-advanced-chat sync badge styling

## Commands
```bash
# Database
cd backend && npm run db:up

# Backend dev
cd backend && npm run start:dev

# Frontend dev
cd frontend && npm run dev

# Prisma
cd backend && npx prisma migrate dev
cd backend && npx prisma studio

# API smoke test
cd frontend && npm run test:api
```

## Rules
See `.cursor/rules/*.mdc` for detailed AI guidance per area.
