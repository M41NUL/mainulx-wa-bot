// ── MAINUL-X WA Bot · API Routes ─────────────────────────────────────
// AUTHOR  : Md. Mainul Islam | OWNER : MAINUL-X | GITHUB : M41NUL
// © MAINUL-X  All Rights Reserved
// ────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { fbGet, fbSet, fbUpdate, fbPush, fbDelete } from '../config/firebase.js';
import { botState, requestPairing } from '../config/bot.js';
import { ownerState } from '../handlers/autoReply.js';
import { getRuntime } from '../utils/timing.js';
import { logBuffer } from '../utils/logger.js';
import { rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const router = Router();

// ── Auth middleware ───────────────────────────────────────────────
function auth(req, res, next) {
  if (req.session?.admin) return next();
  res.status(401).json({ ok: false, error: 'Unauthorized' });
}

// ── Health (public) ───────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), bot: botState.connected });
});

// ── Login / Logout ────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.DASHBOARD_USER && password === process.env.DASHBOARD_PASS) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

router.get('/auth-check', (req, res) => {
  res.json({ ok: !!req.session?.admin });
});

// ── Bot status ────────────────────────────────────────────────────
router.get('/status', auth, async (req, res) => {
  const stats = await fbGet('stats');
  res.json({
    ok: true,
    connected:   botState.connected,
    pairingCode: botState.pairingCode,
    ownerOnline: ownerState.online,
    runtime:     getRuntime(),
    stats:       stats || {},
  });
});

// ── Live log ──────────────────────────────────────────────────────
router.get('/logs', auth, (req, res) => {
  res.json({ ok: true, logs: logBuffer.slice(-50) });
});

// ── Pairing ───────────────────────────────────────────────────────
router.post('/pairing/request', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ ok: false, error: 'Phone required' });
    const code = await requestPairing(phone);
    res.json({ ok: true, code });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/pairing/clear-session', auth, (req, res) => {
  try {
    const sessionDir = join(__dir, '../session');
    rmSync(sessionDir, { recursive: true, force: true });
    res.json({ ok: true, message: 'Session cleared. Restart bot to re-pair.' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── Settings ──────────────────────────────────────────────────────
router.get('/settings', auth, async (req, res) => {
  const data = await fbGet('settings');
  res.json({ ok: true, data });
});

router.put('/settings', auth, async (req, res) => {
  await fbUpdate('settings', req.body);
  res.json({ ok: true });
});

router.put('/settings/timing', auth, async (req, res) => {
  await fbUpdate('settings/timing', req.body);
  res.json({ ok: true });
});

router.put('/settings/payment', auth, async (req, res) => {
  await fbUpdate('settings/payment', req.body);
  res.json({ ok: true });
});

// ── Messages ──────────────────────────────────────────────────────
router.get('/messages', auth, async (req, res) => {
  const data = await fbGet('messages');
  res.json({ ok: true, data });
});

router.put('/messages', auth, async (req, res) => {
  await fbUpdate('messages', req.body);
  res.json({ ok: true });
});

// ── Keywords ──────────────────────────────────────────────────────
router.get('/keywords', auth, async (req, res) => {
  const data = await fbGet('keywords');
  res.json({ ok: true, data });
});

router.post('/keywords', auth, async (req, res) => {
  const { trigger, reply, active = true } = req.body;
  if (!trigger || !reply) return res.status(400).json({ ok: false, error: 'trigger and reply required' });
  const key = await fbPush('keywords', { trigger: trigger.toLowerCase(), reply, active });
  res.json({ ok: true, key });
});

router.put('/keywords/:key', auth, async (req, res) => {
  await fbUpdate(`keywords/${req.params.key}`, req.body);
  res.json({ ok: true });
});

router.delete('/keywords/:key', auth, async (req, res) => {
  await fbDelete(`keywords/${req.params.key}`);
  res.json({ ok: true });
});

// ── Users ─────────────────────────────────────────────────────────
router.get('/users', auth, async (req, res) => {
  const data = await fbGet('users');
  res.json({ ok: true, data: data || {} });
});

router.delete('/users/:num', auth, async (req, res) => {
  await fbDelete(`users/${req.params.num}`);
  res.json({ ok: true });
});

// ── Groups ────────────────────────────────────────────────────────
router.get('/groups', auth, async (req, res) => {
  const data = await fbGet('groups');
  res.json({ ok: true, data: data || {} });
});

router.put('/groups/:jid', auth, async (req, res) => {
  await fbUpdate(`groups/${req.params.jid}`, req.body);
  res.json({ ok: true });
});

// ── Firebase config save (re-init not needed on Render, just save) ──
router.put('/firebase-config', auth, async (req, res) => {
  // Config is env-based on Render; this endpoint just validates
  res.json({ ok: true, message: 'Update env vars on Render dashboard' });
});

export default router;
