// ── MAINUL-X WA Bot · Baileys Core ───────────────────────────────────
// AUTHOR  : Md. Mainul Islam | OWNER : MAINUL-X | GITHUB : M41NUL
// © MAINUL-X  All Rights Reserved
// ────────────────────────────────────────────────────────────────────

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger }     from '../utils/logger.js';
import { handleMessage, handleGroupUpdate, ownerState } from '../handlers/autoReply.js';
import { isOwner }    from '../utils/timing.js';
import pino           from 'pino';

const __dir = dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = join(__dir, '../session');

// ── Bot state (shared with API routes) ───────────────────────────
export const botState = {
  sock:        null,
  connected:   false,
  pairingCode: null,
  qr:          null,
  phone:       null,
};

// ── Start bot ────────────────────────────────────────────────────
export async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version }          = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['MAINUL-X Bot', 'Chrome', '120.0.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  });

  botState.sock = sock;

  // ── Pairing code (if not registered) ────────────────────────
  if (!sock.authState.creds.registered && botState.phone) {
    try {
      const code = await sock.requestPairingCode(botState.phone);
      botState.pairingCode = code;
      logger.sys('Pairing', `Code: ${code}`);
    } catch (e) {
      logger.error('Pairing', e.message);
    }
  }

  // ── Connection events ────────────────────────────────────────
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      botState.qr = qr;
      logger.info('QR', 'QR updated');
    }

    if (connection === 'open') {
      botState.connected   = true;
      botState.pairingCode = null;
      botState.qr          = null;
      logger.sys('Bot', 'Connected to WhatsApp');
    }

    if (connection === 'close') {
      botState.connected = false;
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      logger.warn('Bot', `Disconnected: ${code}`);

      const shouldReconnect = code !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        logger.info('Bot', 'Reconnecting in 5s...');
        setTimeout(() => startBot(), 5000);
      } else {
        logger.warn('Bot', 'Logged out. Clear session to re-pair.');
      }
    }
  });

  // ── Save credentials ─────────────────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── Messages ──────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      await handleMessage(sock, msg);
    }
  });

  // ── Owner presence tracking ───────────────────────────────────
  sock.ev.on('presence.update', ({ id, presences }) => {
    const ownerJid = `${process.env.OWNER_NUMBER}@s.whatsapp.net`;
    if (id === ownerJid || presences[ownerJid]) {
      const p = presences[ownerJid]?.lastKnownPresence;
      ownerState.online = p === 'available' || p === 'composing';
      logger.info('Owner', ownerState.online ? 'Online' : 'Offline');
    }
  });

  // ── Subscribe to owner presence ──────────────────────────────
  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      try {
        await sock.presenceSubscribe(`${process.env.OWNER_NUMBER}@s.whatsapp.net`);
      } catch (_) {}
    }
  });

  // ── Group participants update ─────────────────────────────────
  sock.ev.on('group-participants.update', async (update) => {
    await handleGroupUpdate(sock, update);
  });

  return sock;
}

// ── Request pairing code (called from API) ───────────────────────
export async function requestPairing(phone) {
  botState.phone = phone.replace(/\D/g, '');
  if (botState.sock && !botState.sock.authState.creds.registered) {
    try {
      const code = await botState.sock.requestPairingCode(botState.phone);
      botState.pairingCode = code;
      logger.sys('Pairing', `New code: ${code}`);
      return code;
    } catch (e) {
      logger.error('Pairing', e.message);
      throw e;
    }
  }
  return null;
}
