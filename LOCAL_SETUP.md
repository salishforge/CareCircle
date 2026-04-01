# CareCircle — Local Development Setup

## Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL)
- Git

## Quick Start

### 1. Start the Database

Open Docker Desktop and wait for the engine to initialize (green icon in system tray), then:

```bash
cd D:\Apps\CareCircle
docker compose up -d
```

This starts PostgreSQL 16 on port 5432 with:
- User: `carecircle`
- Password: `carecircle_dev`
- Database: `carecircle`

### 2. Configure Environment

The `.env` file is already configured for local development. If you need to reset it:

```bash
cp .env.example .env
```

Then set `NEXTAUTH_SECRET` to any random string (required for auth):
```
NEXTAUTH_SECRET="local-dev-secret-change-in-production"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

If this is a fresh database, Prisma will create all tables from the schema.

### 5. Seed Demo Data

```bash
npx prisma db seed
```

This creates a demo care circle with:
- **5 users** (all password: `demo1234`):
  - margaret@demo.carecircle.app (Patient)
  - sarah@demo.carecircle.app (Primary Caregiver)
  - david@demo.carecircle.app (Caregiver)
  - maria@demo.carecircle.app (Meal Provider)
  - james@demo.carecircle.app (Caregiver)
- 14 shifts (this week), 21 meals, 2 appointments
- 7 mood entries, 3 medications, shopping list
- Nutrition profile, gratitude messages, requests, notifications

### 6. Start the Dev Server

```bash
npm run dev
```

Open http://localhost:3000

### 7. Log In

Use any demo account:
- Email: `sarah@demo.carecircle.app`
- Password: `demo1234`

## Optional Services

These are optional — the app gracefully degrades if not configured:

| Service | Env Var | Purpose |
|---------|---------|---------|
| Anthropic | `ANTHROPIC_API_KEY` | AI Chat Assistant |
| Twilio | `TWILIO_*` | SMS check-ins & escalation alerts |
| Resend | `RESEND_API_KEY` | Email notifications & daily digest |
| VAPID | `VAPID_*` | Push notifications |

## Running Tests

```bash
npm test          # Run once
npm run test:watch  # Watch mode
```

## Common Issues

**Docker "pipe not found"**: Ensure Docker Desktop is fully started (green icon in tray). Try restarting Docker Desktop.

**Prisma migration errors**: If the database exists with old schema:
```bash
npx prisma migrate reset  # WARNING: drops all data
```

**Port 3000 in use**:
```bash
npm run dev -- -p 3001
```
