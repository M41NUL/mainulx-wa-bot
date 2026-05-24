// ── MAINUL-X WA Bot · Firebase Seed Data ────────────────────────────
// AUTHOR  : Md. Mainul Islam | OWNER : MAINUL-X | GITHUB : M41NUL
// © MAINUL-X  All Rights Reserved
// ────────────────────────────────────────────────────────────────────

import { fbGet, fbSet } from '../config/firebase.js';

export const DEFAULT_SETTINGS = {
  autoReply:        true,
  autoRead:         true,
  keywordSystem:    true,
  personalReply:    true,
  groupReply:       false,
  welcomeMessage:   true,
  groupWelcome:     true,
  groupKeyword:     false,
  paymentReply:     true,
  languageSelection:true,
  timing: {
    active:    true,
    startTime: '22:00',
    endTime:   '08:00',
    days:      ['Sat','Sun','Mon','Tue','Wed'],
  },
  payment: {
    bkash:        '01308850528',
    nagad:        '01308850528',
    rocket:       '01308850528',
    instructions: 'Send payment to bKash/Nagad/Rocket: 01308850528 (Personal). After sending, share your transaction ID. We confirm within 1 hour.',
    active:       true,
  },
};

export const DEFAULT_MESSAGES = {
  welcome:  'Hi! Welcome. The owner is currently offline. I am an automated bot. How can I help you?',
  offline:  'The owner is offline right now. Your message has been noted. Please wait for a reply.',
  help:     'Commands: .menu .ping .runtime .owner .payment .help',
  owner:    'Owner: Md. Mainul Islam | GitHub: M41NUL | Telegram: @mdmainulislaminfo | WA: +8801308850528',
  group:    'This is an automated bot. For direct support please message privately.',
  contact:  'GitHub: https://github.com/M41NUL | Telegram: t.me/mdmainulislaminfo',
  payment:  'Payment methods: bKash/Nagad/Rocket: 01308850528 (Personal). Share txn ID after paying.',
  salam:    'Wa alaikum assalam wa rahmatullahi wa barakatuh!',
  langPrompt: 'Please select your language:\n\n1️⃣ Bangla\n2️⃣ English\n\nReply with 1 or 2',
  welcomeBn: 'হ্যালো! আমি একটি অটোমেটেড বট। মালিক এখন অফলাইনে আছেন। আমি কিভাবে সাহায্য করতে পারি?',
  welcomeEn: 'Hello! I am an automated bot. The owner is currently offline. How can I help you?',
};

export const DEFAULT_KEYWORDS = [
  { trigger: 'salam',            reply: 'Wa alaikum assalam wa rahmatullahi wa barakatuh!',           active: true  },
  { trigger: 'assalamu alaikum', reply: 'Wa alaikum assalam wa rahmatullahi wa barakatuh!',           active: true  },
  { trigger: 'payment',          reply: 'bKash/Nagad/Rocket: 01308850528 (Personal). Share txn ID.', active: true  },
  { trigger: 'price',            reply: 'Contact the owner for pricing. Telegram: @mdmainulislaminfo',active: true  },
  { trigger: 'help',             reply: 'Commands: .menu .ping .runtime .owner .payment .help',       active: true  },
  { trigger: 'owner',            reply: 'Owner: Md. Mainul Islam | GitHub: M41NUL | TG: @mdmainulislaminfo', active: true },
  { trigger: 'group',            reply: 'Join MAINUL-X OFFICIAL: t.me/mdmainulislaminfo',             active: true  },
  { trigger: 'thanks',           reply: "You're welcome! Anything else I can help with?",             active: true  },
  { trigger: 'bye',              reply: 'Goodbye! Have a great day. Come back anytime.',              active: true  },
  { trigger: 'api',              reply: 'API info available at: https://github.com/M41NUL',           active: false },
  { trigger: 'bot',              reply: 'I am MAINUL-X WA Bot. Built with Baileys + Firebase.',       active: true  },
  { trigger: 'contact',          reply: 'GitHub: https://github.com/M41NUL | TG: t.me/mdmainulislaminfo', active: true },
];

// ── Seed if not exists ──────────────────────────────────────────────
export async function seedDefaults() {
  const existing = await fbGet('settings');
  if (!existing) {
    await fbSet('settings', DEFAULT_SETTINGS);
    console.log('[DB] Default settings seeded');
  }

  const msgs = await fbGet('messages');
  if (!msgs) {
    await fbSet('messages', DEFAULT_MESSAGES);
    console.log('[DB] Default messages seeded');
  }

  const kws = await fbGet('keywords');
  if (!kws) {
    const kwObj = {};
    DEFAULT_KEYWORDS.forEach((kw, i) => { kwObj[`kw_${i}`] = kw; });
    await fbSet('keywords', kwObj);
    console.log('[DB] Default keywords seeded');
  }

  const stats = await fbGet('stats');
  if (!stats) {
    await fbSet('stats', { replied: 0, users: 0, groups: 0 });
    console.log('[DB] Stats initialized');
  }
}
