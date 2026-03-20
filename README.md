# ⚡ Nexora — Premium Hackathon Operations Platform

A production-ready, mobile-first PWA for managing hackathons in real-time.  
Built to feel like a polished startup product, not a prototype.

---

## ✨ Features

| Feature | Details |
|---|---|
| **OTP Auth** | Passwordless login via email/phone, JWT sessions |
| **Multi-Hackathon** | Each event is an isolated workspace |
| **Team Dashboard** | Table-first UI, real-time updates via WebSocket |
| **Check-in Station** | Fast manual search + USB QR scanner support |
| **Broadcast Messaging** | WhatsApp, SMS, Internal — async queue, retry |
| **Coordinator View** | Simplified mobile UI with large action buttons |
| **Certificates** | Generate + queue send for all participants |
| **Google Sheets Sync** | Import teams directly from Google Forms |
| **Command Palette** | `⌘K` / `/` — search, quick check-in, navigation |
| **PWA** | Installable on iOS/Android, offline-capable |
| **Dark/Light** | System-adaptive design tokens |
| **Role-based** | Super Admin (full) · Coordinator (scoped) |

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (DM Sans font, custom design system) |
| State | Zustand |
| PWA | vite-plugin-pwa + Workbox |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io |
| Auth | OTP (email/phone) + JWT |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for Postgres) or local PostgreSQL

### 1. Clone and configure

```bash
git clone <repo> nexora && cd nexora
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
DATABASE_URL="postgresql://postgres:nexora_dev@localhost:5432/nexora"
JWT_SECRET="your-random-32-char-secret-here"
```

### 2. Start Postgres

```bash
docker compose up -d
```

> The password in `docker-compose.yml` is `nexora_dev` — matches the `.env` above.

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

Nexora uses **OTP-based authentication** (no passwords).

In `development` mode the server logs and returns the OTP in the API response:

```
[OTP] admin@nexora.dev → 123456
```

The login UI shows it automatically in a dev banner — just tap to copy and verify.

**Seeded accounts:**

| Role | Email | Note |
|---|---|---|
| Super Admin | `admin@nexora.dev` | Full access, can create hackathons |
| Coordinator | `coord1@nexora.dev` | Scoped to assigned teams |
| Coordinator | `coord2@nexora.dev` | |

---

## 📱 PWA — Install on Phone

1. Open http://localhost:5173 in Chrome/Safari on your phone
2. Tap **Share → Add to Home Screen** (iOS) or **Install App** (Android)
3. Nexora launches as a native-like app with no browser chrome

> For production, serve over HTTPS — PWA install prompts require it.

---

## 📁 Project Structure

```
nexora/
├── client/                      # React PWA frontend
│   └── src/
│       ├── App.tsx              # Router + auth guard
│       ├── pages/               # 7 pages
│       ├── components/
│       │   ├── layout/          # AppShell, TopBar, bottom nav
│       │   ├── teams/           # TeamDrawer, SheetsSheet
│       │   ├── broadcast/       # BroadcastSheet
│       │   ├── hackathons/      # CreateHackathonSheet
│       │   ├── command-palette/ # CommandPalette (⌘K)
│       │   └── ui/              # Toasts
│       ├── store/               # Zustand: auth, hackathon, teams, ui
│       └── lib/                 # api, socket, utils
│
├── server/                      # Express backend
│   ├── prisma/
│   │   ├── schema.prisma        # Full DB schema
│   │   └── seed.ts              # 25 teams, 1 hackathon, 3 coordinators
│   └── src/
│       ├── index.ts             # Entry + Socket.io setup
│       ├── routes/              # auth, hackathons, teams, coordinators, messages, other
│       ├── middleware/          # auth (JWT), errorHandler, rateLimiter
│       ├── jobs/                # messageQueue (async broadcast)
│       ├── lib/                 # prisma, logger, socket
│       └── services/            # metricsService
│
├── shared/types/                # Shared TypeScript types
├── docker-compose.yml           # Postgres + Redis
├── setup.sh                     # First-run bootstrap
└── README.md
```

---

## 🔌 API Reference

All routes are prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/otp/request` | Send OTP to email/phone |
| POST | `/auth/otp/verify` | Verify OTP → JWT |
| GET | `/auth/me` | Get current user |

### Hackathons
| Method | Path | Description |
|---|---|---|
| GET | `/hackathons` | List hackathons |
| POST | `/hackathons` | Create (admin) |
| PATCH | `/hackathons/:id` | Update |
| DELETE | `/hackathons/:id` | Delete |

### Teams (scoped to hackathon)
| Method | Path | Description |
|---|---|---|
| GET | `/hackathons/:hid/teams` | List teams (with search/filter) |
| GET | `/hackathons/:hid/teams/search` | Lightweight search |
| PATCH | `/hackathons/:hid/teams/:id` | Update team |
| POST | `/hackathons/:hid/teams/:id/checkin` | Check in |
| POST | `/hackathons/:hid/teams/:id/undo-checkin` | Undo |

### Messages
| Method | Path | Description |
|---|---|---|
| GET | `/hackathons/:hid/messages` | History |
| POST | `/hackathons/:hid/messages/broadcast` | Send broadcast |
| POST | `/hackathons/:hid/messages/:id/retry` | Retry failed |

### Other
| Method | Path |
|---|---|
| GET | `/hackathons/:hid/metrics` |
| GET | `/hackathons/:hid/activity` |
| POST | `/hackathons/:hid/sheets/sync` |
| GET/POST | `/hackathons/:hid/certificates` |
| GET | `/hackathons/:hid/coordinators` |
| POST | `/hackathons/:hid/coordinators` |

---

## 🔴 WebSocket Events

Connect to the server and join a hackathon room:
```js
socket.emit('join:hackathon', hackathonId)
```

Events emitted by server:
| Event | Payload |
|---|---|
| `team:updated` | `{ hackathonId, payload: Team }` |
| `team:checkin` | `{ hackathonId, payload: { team, timestamp } }` |
| `metrics:updated` | `{ hackathonId, payload: Metrics }` |
| `message:status` | `{ hackathonId, payload: { messageId, teamId, status } }` |

---

## 🔧 Environment Variables

```env
# Required
DATABASE_URL="postgresql://..."
JWT_SECRET="min-32-char-random-string"

# Optional integrations
GOOGLE_API_KEY=""          # Google Sheets API
WHATSAPP_API_URL=""        # WhatsApp Business API endpoint
WHATSAPP_TOKEN=""          # WhatsApp access token
TWILIO_ACCOUNT_SID=""      # SMS via Twilio
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
SMTP_HOST=""               # Email (OTP + certificates)
SMTP_USER=""
SMTP_PASS=""
```

---

## 📲 Coordinator Mobile Flow

Coordinators get a simplified view at `/coordinator`:
- See only their assigned teams
- Large **Check In**, **Call**, **WhatsApp** buttons
- No desktop clutter — designed for phone use in a loud venue

---

## 🏆 Seeded Demo Data

- **1 Hackathon**: BuildFest 2024 (ACTIVE)
- **25 Teams** across all statuses (REGISTERED → SUBMITTED)
- **3 Coordinators** assigned to teams
- **Room numbers**, project names, phone numbers all populated

---

## 📝 License

MIT — built for hackathon organizers everywhere.
