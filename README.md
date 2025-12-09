# Telegram Mini App Shop

Production-ready Telegram Mini App shop with Solana deposits, Fastify backend, Prisma/PostgreSQL, and React + Vite frontend.

## Quick start (Docker Compose)
1. Ensure Docker and Docker Compose are installed.
2. From repository root run:
   ```bash
   docker compose up -d --build
   ```
3. Backend available on `http://localhost:4000`, frontend on `http://localhost:5173`.

## Environment
- Bot token is hard-coded per request.
- Important variables (override in `.env` or compose):
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_shop`
  - `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`
  - `COINGECKO_URL=https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=huf`
  - `PORT=4000`

## Backend (development)
```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```
- Start webhook reachable at `https://iqos-center.shop/telegram/webhook`.
- Solana worker runs automatically.

### Prisma migrations
```bash
cd backend
npm run prisma:migrate
```

## Frontend (development)
```bash
cd frontend
npm install
npm run dev -- --host --port 5173
```
Set `VITE_API_URL` to backend base URL if different.

## Project structure
- `backend/`: Fastify API, Telegram bot, Solana worker, Prisma schema.
- `frontend/`: React Mini App UI.
- `docker-compose.yml`: DB + backend + frontend services.

## Notes
- Admin Telegram ID: `8360537584` (super admin).
- Public URL/webhook host: `https://iqos-center.shop`.
- Deposit addresses generated per user; private keys stored base64 in DB (TODO: secure better).
- Rate limiting applied on API and webhook.
- Critical events are logged in `EventLog` and sent to admin.
