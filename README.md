# 🛡️ Surakshita — Women's Safety Web App

A production-ready, mobile-first safety application with real-time emergency response.

---

## Quick Start

### 1. Clone & Setup

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your values

# Client
cp client/.env.example client/.env
# Edit client/.env with your values
```

### 3. Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm start
```

App runs at: http://localhost:3000  
API runs at: http://localhost:5000

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |
| `EMAIL_HOST` | SMTP host (e.g. smtp.gmail.com) |
| `EMAIL_USER` | Email address |
| `EMAIL_PASS` | Email app password |
| `CLIENT_URL` | Frontend URL for CORS |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend API URL |
| `REACT_APP_SOCKET_URL` | Socket.IO server URL |

---

## Features

- **SOS Button** — 3-second countdown with one-tap activation
- **Shake Detection** — DeviceMotion API triggers SOS on strong shake
- **Voice Activation** — Web Speech API listens for your safe word
- **Live Location** — OpenStreetMap with real-time tracking via Socket.IO
- **Emergency Contacts** — SMS (Twilio) + Email alerts with Google Maps link
- **Safe Journey** — Set destination + ETA, auto-alert if overdue
- **Incident Reporting** — Anonymous or named incident reports
- **2FA** — TOTP-based two-factor authentication
- **OTP Email Verification** — Secure signup flow
- **Dark Mode** — Full dark theme support
- **Stealth Mode** — Silent alerts setting
- **PWA** — Installable on mobile

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Register with email + password
- `POST /api/auth/verify-otp` — Verify email OTP
- `POST /api/auth/login` — Login
- `POST /api/auth/login-anonymous` — Anonymous login
- `POST /api/auth/2fa/setup` — Setup TOTP 2FA
- `POST /api/auth/2fa/verify` — Verify 2FA token
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/settings` — Update user settings

### Contacts
- `GET /api/contacts` — List contacts
- `POST /api/contacts` — Add contact
- `PUT /api/contacts/:id` — Update contact
- `DELETE /api/contacts/:id` — Delete contact

### SOS
- `POST /api/sos/trigger` — Trigger SOS alert
- `POST /api/sos/:id/resolve` — Resolve SOS
- `POST /api/sos/:id/location` — Update live location
- `GET /api/sos/active` — Get active SOS
- `GET /api/sos/history` — SOS history

### Journey
- `POST /api/journey/start` — Start safe journey
- `POST /api/journey/:id/checkin` — Check in
- `POST /api/journey/:id/complete` — Mark arrived safely
- `GET /api/journey/active` — Get active journey

### Incidents
- `POST /api/incidents` — Report incident
- `GET /api/incidents` — List incidents

---

## Tech Stack

- **Frontend**: React 18, React Router 6, React-Leaflet, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, Mongoose
- **Database**: MongoDB
- **Auth**: JWT + bcrypt + Speakeasy (TOTP)
- **SMS**: Twilio
- **Email**: Nodemailer
- **Maps**: OpenStreetMap (Leaflet) — no API key needed
- **PWA**: Web App Manifest + Service Worker ready
