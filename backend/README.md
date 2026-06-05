# Attendance System — Backend API

Node.js + Express + Prisma backend for the Advanced Attendance System.

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Primary DB | PostgreSQL |
| Cache / Token Store | Redis |
| Real-time | Socket.io |
| Auth | JWT (access + refresh) |
| QR | HMAC-SHA256 rotating tokens |

---

## Quick Start

### 1. Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally (or via Docker)
- Redis running locally (or via Docker)

```bash
# Docker one-liner (optional)
docker run -d --name pg -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=attendance_db -p 5432:5432 postgres:16
docker run -d --name redis -p 6379:6379 redis:7
```

### 2. Install

```bash
cd backend
npm install
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT secrets, QR secret
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Database

```bash
npm run db:generate   # generate Prisma client
npm run db:migrate    # run migrations (creates tables)
npm run db:seed       # seed demo data
```

### 5. Run

```bash
npm run dev    # development (nodemon)
npm start      # production
```

Server starts at `http://localhost:5000`.

---

## API Overview

All endpoints return `{ success: boolean, data?: any, message?: string }`.

### Authentication  `POST /api/auth/...`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | — | Login, returns access + refresh token |
| POST | `/logout` | ✓ | Revoke refresh token |
| POST | `/refresh` | — | Get new access token |
| GET | `/me` | ✓ | Current user profile |
| PUT | `/change-password` | ✓ | Change password |
| POST | `/devices` | ✓ | Register device |
| DELETE | `/devices/:id` | ✓ | Deactivate device |
| POST | `/users` | Admin | Create user |

### Attendance  `POST /api/attendance/...`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/check-in` | Employee | Full check-in (QR + WiFi + Device + Selfie) |
| POST | `/check-out` | Employee | Clock out |
| GET | `/status` | Employee | Today's attendance status |
| GET | `/history` | Employee | Historical records |
| GET | `/flagged` | Admin | Flagged records |
| PUT | `/records/:id/flag` | Admin | Flag a record |
| PUT | `/records/:id/approve` | Admin | Approve a flagged record |

### Sessions  `/api/sessions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Admin | Create session |
| POST | `/:id/start` | Admin | Start → generates first QR |
| POST | `/:id/pause` | Admin | Pause |
| POST | `/:id/resume` | Admin | Resume |
| POST | `/:id/end` | Admin | End |
| POST | `/:id/lock` | Admin | Lock |
| POST | `/:id/refresh-qr` | Admin | Force QR rotation |
| GET | `/:id/status` | Admin | Live session stats |
| GET | `/:id/qr` | ✓ | Current QR as PNG image |

### Breaks  `/api/breaks`
### Leaves  `/api/leaves`
### Fraud   `/api/fraud`
### Reports `/api/reports`
### Admin   `/api/admin`

---

## Real-time Events (Socket.io)

Connect with Bearer token in `auth.token`:

```js
const socket = io('http://localhost:5000', { auth: { token: '<accessToken>' } });
```

| Event | Direction | Payload |
|-------|-----------|---------|
| `attendance:checkin` | Server → Client | `{ record, sessionId }` |
| `attendance:checkout` | Server → Client | `{ record, sessionId }` |
| `qr:rotated` | Server → Client | `{ sessionId, tokenId, expiresAt, expiresIn }` |
| `session:started` | Server → Client | session object |
| `session:paused` | Server → Client | session object |
| `session:ended` | Server → Client | session object |
| `fraud:alerts` | Server → Admins | alerts array |
| `emergency:stop_all` | Server → All | `{ officeId }` |
| `notification:employee` | Server → Client | `{ userId, message }` |

Join a session room to receive QR rotations:
```js
socket.emit('session:join', sessionId);
```

---

## Check-in Flow

```
Mobile App
  └─► POST /api/attendance/check-in
        body: { tokenValue, sessionId, deviceFingerprint,
                wifiSSID, wifiBSSID, selfieImageUrl, ipAddress }

Server validates in order:
  1. Session is ACTIVE
  2. Device is registered (if deviceBindingRequired)
  3. WiFi SSID/BSSID matches office fingerprint (if wifiRequired)
  4. QR token is valid + not expired + not consumed (Redis fast-path)
  5. Token consumed (single-use)
  6. Selfie face-match ≥ threshold (if selfieRequired)
  7. AttendanceRecord created → status PRESENT or LATE
  8. FraudDetectionEngine.analyze() runs async
  9. Real-time update emitted to admin dashboard
```

---

## Seed Accounts

After running `npm run db:seed`:

| Email | Password | Role |
|-------|----------|------|
| superadmin@acme.com | Admin@1234 | SUPER_ADMIN |
| admin@acme.com | Admin@1234 | ADMIN |
| employee@acme.com | Admin@1234 | EMPLOYEE |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma        ← All models + enums
│   └── seed.js
├── src/
│   ├── config/
│   │   ├── app.js           ← Express setup
│   │   ├── database.js      ← Prisma client
│   │   ├── env.js           ← Validated env vars
│   │   ├── logger.js        ← Winston
│   │   └── redis.js         ← IORedis
│   ├── controllers/         ← Thin HTTP handlers
│   ├── middleware/          ← auth, roleGuard, rateLimiter, validate, errorHandler
│   ├── routes/              ← Express routers
│   ├── services/            ← Business logic
│   │   ├── AuthenticationService.js
│   │   ├── AttendanceService.js  ← Facade
│   │   ├── BreakService.js
│   │   ├── EmergencyControlService.js
│   │   ├── FraudDetectionEngine.js  ← Observer
│   │   ├── LeaveService.js
│   │   ├── NotificationService.js
│   │   ├── QRTokenService.js     ← Factory
│   │   ├── ReportService.js
│   │   └── SessionService.js     ← State machine
│   ├── sockets/
│   │   ├── io.js            ← Socket.io init + rooms
│   │   └── qrRotation.js    ← QR rotation worker
│   └── server.js            ← Entry point
└── .env.example
```
