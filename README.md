# MAINUL-X WhatsApp Auto Reply Bot

> **AUTHOR**: Md. Mainul Islam | **OWNER**: MAINUL-X | **GITHUB**: [M41NUL](https://github.com/M41NUL)
> **WHATSAPP**: +8801308850528 | **TELEGRAM**: [t.me/mdmainulislaminfo](https://t.me/mdmainulislaminfo)
> © MAINUL-X All Rights Reserved

---

## Stack
- **Node.js** v20+ (ES Modules)
- **Baileys** — WhatsApp Web API
- **Firebase** Realtime Database
- **Express.js** — Dashboard server
- **Render** — Deployment

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable **Realtime Database** → Start in test mode
4. Go to **Project Settings → Service Accounts**
5. Click **Generate new private key** → download JSON
6. Copy values to `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

---

## Local Development

```bash
git clone https://github.com/M41NUL/mainulx-wa-bot
cd mainulx-wa-bot
cp .env.example .env
# Fill in .env values
npm install
npm start
```

Dashboard: `http://localhost:3000`
Login: admin / mainulx2024 (set in .env)

---

## Render Deployment

1. Push project to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect GitHub repo
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add all **Environment Variables** from `.env.example`
7. Add **Disk** (for session storage):
   - Name: `session-storage`
   - Mount Path: `/opt/render/project/src/session`
   - Size: 1 GB

---

## Pairing Bot

1. Open dashboard → **Pairing** page
2. Enter WhatsApp number with country code (e.g. `8801308850528`)
3. Click **Request Pairing**
4. Copy the 8-digit code
5. Open WhatsApp → **Linked Devices → Link with Phone Number**
6. Enter the code

---

## Firebase Data Structure

```
/settings          → bot controls, timing, payment config
/messages          → all auto-reply message templates
/keywords          → keyword trigger → reply mapping
/users/{number}    → user data, language preference
/groups/{jid}      → group settings
/stats             → reply count, user count
```

---

## Dashboard Routes

| Route | Description |
|-------|-------------|
| `/` | Main dashboard |
| `/api/health` | Health check (public) |
| `/api/status` | Bot status |
| `/api/keywords` | CRUD keywords |
| `/api/messages` | Get/update messages |
| `/api/settings` | Get/update settings |
| `/api/users` | User list |
| `/api/groups` | Group list |
| `/api/pairing/request` | Request pairing code |
| `/api/logs` | Live bot logs |

---

## Folder Structure

```
mainulx-wa-bot/
├── index.js              ← Entry point
├── config/
│   ├── bot.js            ← Baileys core
│   └── firebase.js       ← Firebase init + helpers
├── handlers/
│   └── autoReply.js      ← Auto reply logic
├── database/
│   └── seed.js           ← Default data seeder
├── routes/
│   └── api.js            ← REST API endpoints
├── utils/
│   ├── logger.js         ← Console logger
│   └── timing.js         ← Runtime + timing utils
├── public/
│   └── index.html        ← iOS-style dashboard
├── session/              ← Baileys session files
├── .env.example
├── render.yaml
└── package.json
```

---

*© MAINUL-X All Rights Reserved*
