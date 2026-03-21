# ⚡ Nexora — Premium Hackathon Operations Platform

A production-ready, mobile-first PWA for managing hackathons in real-time.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL) or a local PostgreSQL instance

### 1. Clone and configure

```bash
cp server/.env.example server/.env
# Edit DATABASE_URL and JWT_SECRET
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Install, migrate, seed

```bash
bash setup.sh
# or manually:
npm run install:all
npm run db:setup
```

### 4. Run

```bash
npm run dev
```

- **App**: http://localhost:5173
- **API**: http://localhost:4000/health

---

## 🔐 Login

OTP-based authentication. In **development** mode, the OTP is always `123456` and shown in the server console + in a dev banner on the login screen.

**Seeded accounts:**

| Role | Email |
|---|---|
| Super Admin | `admin@nexora.dev` |
| Coordinator | `coord1@nexora.dev` |
| Coordinator | `coord2@nexora.dev` |

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| State | Zustand |
| PWA | vite-plugin-pwa + Workbox |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io |
| Auth | OTP (email/phone) + JWT |

---

## 🔑 Key Bug Fixes (vs original)

1. **`trust proxy` added** — prevents rate limiter crash behind Render/ngrok
2. **`_count` fixed** — hackathon team counts now show correctly everywhere
3. **Real OTP flow** — OTPs stored in DB, expire in 10 min, invalidate on re-request
4. **Root Prisma schema removed** — only `server/prisma/` should exist (PostgreSQL)
5. **Crash-safe routes** — invalid query params no longer crash the server
6. **Onboarding step** — new users are prompted for their name after first login

---

## 📁 Project Structure

```
nexora/
├── client/                 # React PWA frontend
│   └── src/
│       ├── App.tsx
│       ├── pages/          # Auth, Dashboard, Teams, CheckIn, Messages, Certificates, Hackathons, CoordinatorView
│       ├── components/
│       │   ├── layout/     # AppShell, Sidebar, TopBar
│       │   ├── teams/      # TeamDrawer, SheetsSheet
│       │   ├── broadcast/  # BroadcastSheet
│       │   ├── hackathons/ # CreateHackathonSheet
│       │   ├── command-palette/ # CommandPalette (⌘K)
│       │   └── ui/         # Toasts
│       ├── store/          # Zustand: auth, hackathon, teams, ui
│       └── lib/            # api, socket, utils
│
├── server/                 # Express backend
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL schema
│   │   └── seed.ts         # 25 teams, 1 hackathon, 3 coordinators
│   └── src/
│       ├── index.ts        # Entry + Socket.io + trust proxy
│       ├── routes/         # auth, hackathons, teams, coordinators, messages, other
│       ├── middleware/      # auth (JWT), errorHandler, rateLimiter
│       ├── jobs/           # messageQueue (async broadcast)
│       ├── lib/            # prisma, logger, socket
│       └── services/       # metricsService
│
├── shared/types/           # Shared TypeScript types
├── docker-compose.yml
├── setup.sh
└── README.md
```

---

## 🌍 Deployment

### Frontend → Vercel

```bash
cd client && vercel deploy
# Set env: VITE_API_URL=https://your-api.onrender.com/api
```

### Backend → Render

- Build: `npm install && npx prisma generate && npx prisma migrate deploy && npx tsc`
- Start: `node dist/index.js`
- Env vars: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`, `PORT=4000`

---

## 🔌 API Reference

All routes prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/otp/request` | Send OTP |
| POST | `/auth/otp/verify` | Verify OTP → JWT |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/me` | Update profile |
| GET | `/hackathons` | List hackathons |
| POST | `/hackathons` | Create (admin) |
| PATCH | `/hackathons/:id` | Update |
| DELETE | `/hackathons/:id` | Delete |
| GET | `/hackathons/:hid/teams` | List teams |
| POST | `/hackathons/:hid/teams/:id/checkin` | Check in |
| GET | `/hackathons/:hid/metrics` | Live metrics |
| POST | `/hackathons/:hid/messages/broadcast` | Broadcast |
| GET/POST | `/hackathons/:hid/certificates` | Certificates |

## 🔴 WebSocket Events

```js
socket.emit('join:hackathon', hackathonId)
```

| Event | Description |
|---|---|
| `team:updated` | Team data changed |
| `team:checkin` | Team checked in |
| `metrics:updated` | Metrics recalculated |
| `message:status` | Broadcast delivery update |
