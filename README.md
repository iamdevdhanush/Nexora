# ⚡ Nexora — Production Hackathon Management SaaS

A production-ready, full-stack SaaS for managing hackathons end-to-end.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)

### 1. Configure environment
```bash
cp server/.env.example server/.env
# Edit DATABASE_URL and JWT_SECRET in server/.env
```

### 2. Start PostgreSQL
```bash
docker compose up -d
```

### 3. Install, migrate, seed
```bash
bash setup.sh
```

### 4. Run
```bash
npm run dev
```

- **App**: http://localhost:5173
- **API**: http://localhost:4000/health

---

## 🔐 Login

OTP-based authentication. In **development** mode, OTP is always `123456`.

| Role | Email |
|---|---|
| Super Coordinator | `admin@nexora.dev` |
| Coordinator | `coord1@nexora.dev` |
| Coordinator | `coord2@nexora.dev` |

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io |
| Auth | OTP (email/phone) + JWT |

---

## 📁 Project Structure

```
nexora/
├── client/                 # React PWA frontend
│   └── src/
│       ├── App.tsx
│       ├── pages/
│       │   ├── AuthPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── TeamsPage.tsx
│       │   ├── CheckInPage.tsx
│       │   ├── MessagesPage.tsx
│       │   ├── CertificatesPage.tsx
│       │   ├── HackathonsPage.tsx
│       │   ├── HackathonDashboardPage.tsx  ← NEW
│       │   ├── CoordinatorView.tsx
│       │   └── JoinPage.tsx                ← NEW (invite flow)
│       ├── components/
│       │   ├── layout/     # AppShell, Sidebar, TopBar
│       │   ├── teams/      # TeamDrawer, SheetsSheet, CreateTeamSheet
│       │   ├── broadcast/  # BroadcastSheet
│       │   ├── hackathons/ # CreateHackathonSheet, InviteSheet
│       │   ├── command-palette/
│       │   └── ui/         # Toasts
│       ├── store/          # authStore, hackathonStore, teamsStore, uiStore
│       └── lib/            # api, socket, utils
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma   # Full PostgreSQL schema
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── hackathons.ts
│       │   ├── teams.ts
│       │   ├── coordinators.ts
│       │   ├── messages.ts
│       │   ├── invites.ts   ← NEW
│       │   └── other.ts     (metrics, activity, sheets, certs, problems)
│       ├── middleware/
│       ├── jobs/
│       ├── lib/
│       └── services/
│
├── shared/types/
├── docker-compose.yml
├── setup.sh
└── README.md
```

---

## ✨ Features

### Authentication
- OTP-based login (email or phone)
- First-time signup with name onboarding
- JWT tokens, 7-day expiry

### Hackathon Management
- Create hackathons with name, description, venue, dates, max teams
- Two modes: **Predefined** (teams choose) or **On-spot** (coordinators assign) problem statements
- Status lifecycle: Draft → Active → Ended
- Full CRUD from the Hackathon Dashboard page

### Invite System ✅ NEW
- Generate unique invite links with UUID tokens
- Configurable expiry (1, 3, 7, 14 days)
- Optional approval requirement
- Pre-written professional invitation message
- `/join/:token` frontend flow — works with or without existing account

### Team Management
- Create, edit, delete teams
- Assign rooms, coordinators, problem statements
- Check-in flow with undo support
- QR code scanner compatible check-in station
- Real-time updates via Socket.io

### Messaging
- Broadcast to all or selected teams
- Channels: WhatsApp, SMS, Internal
- Async delivery queue with retry support
- Delivery status tracking per recipient

### Certificates
- Generate PARTICIPATION, WINNER, RUNNER_UP, SPECIAL certificates
- Bulk generation for all teams
- Status tracking: Pending → Generated → Sent

### Activity Logs
- All edits, check-ins, and changes tracked
- Visible in Hackathon Dashboard → Activity tab

### Command Palette (⌘K)
- Quick navigate, check in teams, send broadcasts, create teams

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
| POST | `/invites` | Generate invite link |
| GET | `/invites/:token` | Preview invite |
| POST | `/invites/:token/accept` | Accept invite |
| GET | `/hackathons/:hid/teams` | List teams |
| POST | `/hackathons/:hid/teams` | Create team |
| PATCH | `/hackathons/:hid/teams/:id` | Update team |
| DELETE | `/hackathons/:hid/teams/:id` | Delete team |
| POST | `/hackathons/:hid/teams/:id/checkin` | Check in |
| GET | `/hackathons/:hid/metrics` | Live metrics |
| POST | `/hackathons/:hid/messages/broadcast` | Broadcast |
| GET | `/hackathons/:hid/certificates` | List certs |
| POST | `/hackathons/:hid/certificates/generate` | Generate certs |
| GET | `/hackathons/:hid/activity` | Activity logs |
| POST | `/hackathons/:hid/sheets/sync` | Sync from Google Sheets |

---

## 🔴 WebSocket Events

| Event | Description |
|---|---|
| `team:updated` | Team data changed |
| `team:checkin` | Team checked in |
| `metrics:updated` | Metrics recalculated |
| `message:status` | Broadcast delivery update |

---

## 🔑 Key Bug Fixes

1. **`trust proxy` added** — prevents rate limiter crash behind Render/ngrok
2. **`_count` fixed** — team counts show correctly everywhere
3. **Real OTP flow** — OTPs stored in DB, expire in 10 min
4. **Root Prisma schema removed** — only `server/prisma/` (PostgreSQL)
5. **Invite system** — secure UUID tokens with expiry and accept flow
6. **Delete team** — with confirmation dialog
7. **Problem statement mode** — PREDEFINED vs ON_SPOT per hackathon
