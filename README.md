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
| Super Admin | `admin@nexora.dev` |
| Coordinator | `coord1@nexora.dev` |
| Coordinator | `coord2@nexora.dev` |

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io |
| Auth | OTP (email) + JWT |

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
- Email vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

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
