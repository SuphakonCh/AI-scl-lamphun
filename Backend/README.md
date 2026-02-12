# Backend (Elysia + PostgreSQL)

## Prerequisites
- Bun
- Docker (for local PostgreSQL)

## Run PostgreSQL locally
```bash
docker compose up -d db
```

## Environment
Use `.env` with PostgreSQL values:
- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `DB_USERNAME=user`
- `DB_PASSWORD=adminUser123`
- `DB_DATABASE=mydb`
- `DB_SSL=false`

## Install and run
```bash
bun install
bun run dev
```

The service will create required tables at startup, including `cache_entries` for persistent cache storage in PostgreSQL.

## Build and start server
```bash
bun run build
bun run start
```
