// ── MAINUL-X WA Bot · Timing Utils ───────────────────────────────────
// AUTHOR  : Md. Mainul Islam | OWNER : MAINUL-X | GITHUB : M41NUL
// © MAINUL-X  All Rights Reserved
// ────────────────────────────────────────────────────────────────────

import { fbGet } from '../config/firebase.js';

// ── Runtime tracker ───────────────────────────────────────────────
const BOT_START = Date.now();

export function getRuntime() {
  const s   = Math.floor((Date.now() - BOT_START) / 1000);
  const d   = Math.floor(s / 86400);
  const h   = Math.floor((s % 86400) / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { days: d, hours: h, minutes: m, seconds: sec, total: s,
    formatted: `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s` };
}

// ── Check if current time is within offline timing window ─────────
export async function isWithinOfflineTiming() {
  const settings = await fbGet('settings');
  if (!settings?.timing?.active) return true; // no timing = always reply

  const { startTime, endTime, days } = settings.timing;
  const now  = new Date();
  const day  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];

  if (days && !days.includes(day)) return false;

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const st  = sh * 60 + sm;
  const et  = eh * 60 + em;

  // Handle overnight window e.g. 22:00 → 08:00
  if (st > et) return cur >= st || cur < et;
  return cur >= st && cur < et;
}

// ── Normalize phone number (strip @s.whatsapp.net etc) ────────────
export function normalizeJid(jid = '') {
  return jid.replace(/[@:].*/g, '').replace(/\D/g, '');
}

export function isOwner(jid) {
  return normalizeJid(jid) === process.env.OWNER_NUMBER?.replace(/\D/g, '');
}

export function isGroup(jid = '') {
  return jid.endsWith('@g.us');
}
