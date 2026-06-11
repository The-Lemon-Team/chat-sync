# AGENTS.md — Chat-Sync

## Project
Offline Telegram client and personal journal manager. Hub account pulls TG content into local forks for autonomous offline use.

## Agent Roles

### Backend Agent
- NestJS modules in `backend/src/`
- GramJS for MTProto (user sessions, not bots)
- Prisma for PostgreSQL persistence
- WebSocket via `ChatGateway` namespace `/chat`

### Frontend Agent
- Vue 3 SPA in `frontend/` (scaffold pending)
- Dexie.js for offline IndexedDB cache
- Pinia stores sync with backend REST + WebSocket
- `vue-advanced-chat` wrapper with sync status indicators

### Database Agent
- Schema changes via `backend/prisma/schema.prisma`
- Always create migrations: `npx prisma migrate dev`
- Docker PostgreSQL on port 5433

## Current Status
- [x] Prisma schema + migrations
- [x] Telegram auth (GramJS)
- [x] SyncService + ChatGateway
- [x] ChatFork REST API
- [x] Vue 3 frontend scaffold (Safe Mode, manual chat pick)
- [ ] Dexie full offline sync polish
- [ ] vue-advanced-chat sync badge styling

## Commands
```bash
# Database
cd backend && npm run db:up

# Backend dev
cd backend && npm run start:dev

# Prisma
cd backend && npx prisma migrate dev
cd backend && npx prisma studio
```

## Rules
See `.cursor/rules/*.mdc` for detailed AI guidance per area.
