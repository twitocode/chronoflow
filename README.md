# Chronoflow

Full-stack stock dashboard: live charts, price alerts, news, and AI-assisted analysis. The web app is a React frontend; the API is **Go** with PostgreSQL, Redis, and WebSocket streaming.

## Repository layout

| Directory | Role |
|-----------|------|
| `client/` | Vite, TanStack Router & Query, Tailwind CSS v4 |
| `server/` | Go API (`chi`), `sqlc` + PostgreSQL, Redis cache, Finnhub WebSocket |

## Prerequisites

- [Node](https://nodejs.org/en) (client)
- [Go](https://go.dev/) 1.25+ (server)
- [PostgreSQL](https://www.postgresql.org/) and [Redis](https://redis.io/) (local or hosted, e.g. Neon + Upstash)

Optional: [sqlc](https://docs.sqlc.dev/) if you change SQL queries and need to regenerate `internal/db`.

## Quick start

### 1. Database

Create a database and apply the schema:

```bash
psql "$DATABASE_URL" -f server/schema.sql
```

### 2. Server (`server/`)

Copy environment variables (see table below into a `server/.env` file, or set them in your shell). `.env` is optional in production if all variables are set by the host.

```bash
cd server
go run ./cmd/chronoflow
```

The API listens on `PORT` (default `8000`).

### 3. Client (`client/`)

```bash
cd client
cp .env.example .env
# Set VITE_API_URL to your API origin (e.g. http://localhost:8000)
bun install
bun run dev
```

The dev server runs on [http://localhost:3000](http://localhost:3000).

## Environment variables

### Server (`server/`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (`postgres://...`) |
| `REDIS_URL` | Redis address (e.g. `host:6379` or Upstash URL) |
| `FINNHUB_KEY` | Finnhub API key (REST + WebSocket market stream) |
| `MARKET_AUX_KEY` | MarketAux API key |
| `GEMINI_API_KEY` | Google Gemini (analysis features) |
| `JWT_SECRET` | Signing secret for auth cookies |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (include your frontend URL in production) |
| `PORT` | HTTP listen port (Render and others often set this automatically) |
| `APP_ENV` | Set to `development` for colored dev logs |

### Client (`client/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL of the Go API |
| `VITE_LOGO_DEV_KEY` | Optional [Logo.dev](https://www.logo.dev/) key for company logos |
| `VITE_FORCE_MARKET_OPEN` | Optional: set to `true` to show the live chart UI outside US regular hours (dev/testing) |

## Scripts

**Client**

```bash
npm run dev      # Vite dev server
npm run build    # Production build (Nitro; Vercel sets VERCEL=1 for deploy output)
npm run start    # Run Nitro output locally (after build)
```

**Server**

```bash
go run ./cmd/chronoflow
go build -o bin/chronoflow ./cmd/chronoflow
```

## Challenges I had creating in development

