// ── MAINUL-X WA Bot · Entry Point ────────────────────────────────────
// AUTHOR  : Md. Mainul Islam
// OWNER   : MAINUL-X
// GITHUB  : M41NUL → https://github.com/M41NUL
// WHATSAPP: +8801308850528
// TELEGRAM: t.me/mdmainulislaminfo
// © MAINUL-X  All Rights Reserved
// ────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import express        from 'express';
import session        from 'express-session';
import cors           from 'cors';
import helmet         from 'helmet';
import morgan         from 'morgan';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { initFirebase }  from './config/firebase.js';
import { startBot }      from './config/bot.js';
import { seedDefaults }  from './database/seed.js';
import apiRouter         from './routes/api.js';
import { logger }        from './utils/logger.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const PORT  = process.env.PORT || 3000;
const app   = express();

// ── Middleware ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret:            process.env.SESSION_SECRET || 'mainulx-secret-dev',
  resave:            false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));

// ── Static files (dashboard) ──────────────────────────────────────
app.use(express.static(join(__dir, 'public')));

// ── API routes ────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Dashboard SPA fallback ────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(join(__dir, 'public', 'index.html'));
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Express', err.message);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────────
async function bootstrap() {
  logger.sys('Boot', '── MAINUL-X WA Bot Starting ──');
  logger.sys('Boot', `Node ${process.version}`);

  // Firebase
  initFirebase();
  await seedDefaults();

  // Express server
  app.listen(PORT, () => {
    logger.sys('Server', `Dashboard running on http://localhost:${PORT}`);
  });

  // WhatsApp Bot
  logger.sys('Bot', 'Starting Baileys...');
  await startBot();

  // Crash protection
  process.on('uncaughtException',      e => logger.error('Crash', e.message));
  process.on('unhandledRejection',     e => logger.error('Crash', String(e)));
}

bootstrap();
