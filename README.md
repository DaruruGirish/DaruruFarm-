# Daruru Farm

**Daruru Farm** is a full-stack app for farm operations:

- **Backend** – NestJS API (Node.js, TypeScript) with MySQL
- **Frontend** – Vite + React UI

## Prerequisites

- **Node.js 22** (recommended)
- **MySQL 8** running locally (database `daruru_farm`)

## Environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in database, JWT, and Razorpay values. Do not commit `.env` files.

## Run locally

```bash
cd backend
npm install
npm run start
```

```bash
cd frontend
npm install
npm run dev
```

- API: `http://localhost:3000`
- UI: `http://localhost:5173` (proxies `/api` to the backend)

Health check:

```bash
curl http://localhost:3000/health
```

Optional local demo data (never used in production):

```bash
cd backend
npm run seed:dev
```

See `scripts/dev-seed/README.md`. A new farmer in production starts with empty holdings and logs what they actually do.

## Testing

```bash
cd backend && npm run test
cd frontend && npm run test
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
