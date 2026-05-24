// ── MAINUL-X WA Bot · Auto Reply Handler ─────────────────────────────
// AUTHOR  : Md. Mainul Islam | OWNER : MAINUL-X | GITHUB : M41NUL
// © MAINUL-X  All Rights Reserved
// ────────────────────────────────────────────────────────────────────

import { fbGet, fbSet, fbUpdate, fbPush } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { isWithinOfflineTiming, isOwner, isGroup, normalizeJid } from '../utils/timing.js';

// ── State ─────────────────────────────────────────────────────────
export const ownerState = { online: false };

// ── Main message handler ─────────────────────────────────────────
export async function handleMessage(sock, msg) {
  try {
    const jid  = msg.key.remoteJid;
    const from = msg.key.participant || jid;
    const body = extractBody(msg);

    if (!body || msg.key.fromMe) return;

    // ── Auto read ──────────────────────────────────────────────
    const settings = await fbGet('settings');
    if (settings?.autoRead) {
      await sock.readMessages([msg.key]);
    }

    // ── Owner message → skip auto reply ───────────────────────
    if (isOwner(from) || isOwner(jid)) return;

    // ── Commands ───────────────────────────────────────────────
    if (body.startsWith('.')) {
      await handleCommand(sock, jid, from, body.toLowerCase(), settings);
      return;
    }

    // ── Group handling ─────────────────────────────────────────
    if (isGroup(jid)) {
      await handleGroupMessage(sock, jid, from, body, settings);
      return;
    }

    // ── Personal message handling ──────────────────────────────
    await handlePersonalMessage(sock, jid, from, body, settings);

  } catch (err) {
    logger.error('AutoReply', err.message);
  }
}

// ── Personal message logic ────────────────────────────────────────
async function handlePersonalMessage(sock, jid, from, body, settings) {
  if (!settings?.personalReply) return;

  const num    = normalizeJid(jid);
  const user   = await fbGet(`users/${num}`);
  const msgs   = await fbGet('messages');

  // ── First time user → welcome + language prompt ────────────
  if (!user) {
    await fbSet(`users/${num}`, {
      jid, number: num, language: null,
      firstSeen: Date.now(), lastSeen: Date.now(), messageCount: 1,
    });
    await fbUpdate('stats', { users: (await fbGet('stats/users') || 0) + 1 });

    if (settings?.welcomeMessage) {
      await sendText(sock, jid, msgs?.welcome || 'Welcome!');
    }
    if (settings?.languageSelection) {
      await sendText(sock, jid, msgs?.langPrompt || 'Reply 1 for Bangla, 2 for English');
    }
    logger.info('NewUser', num);
    return;
  }

  // ── Language selection pending ──────────────────────────────
  if (user.language === null) {
    if (body === '1') {
      await fbUpdate(`users/${num}`, { language: 'bn', lastSeen: Date.now() });
      await sendText(sock, jid, msgs?.welcomeBn || 'স্বাগতম!');
      logger.info('Lang', `${num} → Bangla`);
      return;
    }
    if (body === '2') {
      await fbUpdate(`users/${num}`, { language: 'en', lastSeen: Date.now() });
      await sendText(sock, jid, msgs?.welcomeEn || 'Welcome!');
      logger.info('Lang', `${num} → English`);
      return;
    }
  }

  // ── Update user last seen ──────────────────────────────────
  await fbUpdate(`users/${num}`, {
    lastSeen: Date.now(),
    messageCount: (user.messageCount || 0) + 1,
  });

  // ── Check owner online → skip auto reply ──────────────────
  if (ownerState.online) {
    logger.info('Skip', `Owner online → no reply to ${num}`);
    return;
  }

  // ── Check timing window ────────────────────────────────────
  if (!await isWithinOfflineTiming()) {
    logger.info('Skip', `Outside timing window → no reply to ${num}`);
    return;
  }

  // ── Keyword match ──────────────────────────────────────────
  if (settings?.keywordSystem) {
    const replied = await matchKeyword(sock, jid, body, user.language);
    if (replied) return;
  }

  // ── Default offline message ────────────────────────────────
  await sendText(sock, jid, msgs?.offline || 'Owner is offline. Please wait.');
  await fbUpdate('stats', { replied: (await fbGet('stats/replied') || 0) + 1 });
  logger.info('AutoReply', `Sent to ${num}`);
}

// ── Group message logic ───────────────────────────────────────────
async function handleGroupMessage(sock, jid, from, body, settings) {
  if (!settings?.groupReply) return;
  if (!await isWithinOfflineTiming()) return;

  if (settings?.groupKeyword) {
    const replied = await matchKeyword(sock, jid, body, 'en');
    if (replied) return;
  }

  const msgs = await fbGet('messages');
  await sendText(sock, jid, msgs?.group || 'This is an automated bot.');
  logger.info('GroupReply', jid);
}

// ── Group welcome on join ─────────────────────────────────────────
export async function handleGroupUpdate(sock, update) {
  try {
    const settings = await fbGet('settings');
    if (!settings?.groupWelcome) return;

    const { id, participants, action } = update;
    if (action !== 'add') return;

    const msgs = await fbGet('messages');
    for (const p of participants) {
      const name = p.split('@')[0];
      await sendText(sock, id, `Welcome @${name}!\n\n${msgs?.group || 'Glad to have you here.'}`);
      logger.info('GroupWelcome', `${name} joined ${id}`);
    }
  } catch (err) {
    logger.error('GroupUpdate', err.message);
  }
}

// ── Keyword matcher ───────────────────────────────────────────────
async function matchKeyword(sock, jid, body, lang) {
  const kws = await fbGet('keywords');
  if (!kws) return false;

  const lower = body.toLowerCase().trim();
  for (const key of Object.keys(kws)) {
    const kw = kws[key];
    if (!kw.active) continue;
    if (lower.includes(kw.trigger.toLowerCase())) {
      await sendText(sock, jid, kw.reply);
      await fbUpdate('stats', { replied: (await fbGet('stats/replied') || 0) + 1 });
      logger.info('Keyword', `"${kw.trigger}" matched`);
      return true;
    }
  }
  return false;
}

// ── Command handler ───────────────────────────────────────────────
async function handleCommand(sock, jid, from, body, settings) {
  if (!isOwner(from) && !isOwner(jid)) return; // owner only

  const msgs = await fbGet('messages');
  const cmd  = body.split(' ')[0];

  const handlers = {
    '.menu':    () => sendText(sock, jid, '📋 Commands:\n.menu\n.ping\n.runtime\n.owner\n.payment\n.help'),
    '.ping':    () => sendText(sock, jid, 'Pong! Bot is alive.'),
    '.runtime': async () => {
      const { getRuntime } = await import('../utils/timing.js');
      await sendText(sock, jid, `Runtime: ${getRuntime().formatted}`);
    },
    '.owner':   () => sendText(sock, jid, msgs?.owner   || 'Owner: Md. Mainul Islam'),
    '.payment': () => sendText(sock, jid, msgs?.payment || 'Check payment info.'),
    '.help':    () => sendText(sock, jid, msgs?.help    || 'Use .menu for commands'),
  };

  if (handlers[cmd]) {
    await handlers[cmd]();
    logger.info('CMD', `${cmd} executed`);
  }
}

// ── Send text helper ──────────────────────────────────────────────
async function sendText(sock, jid, text) {
  await sock.sendMessage(jid, { text });
}

// ── Extract message body ──────────────────────────────────────────
function extractBody(msg) {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
}
