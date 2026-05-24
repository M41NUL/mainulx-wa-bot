// ── MAINUL-X WA Bot · Firebase Config ───────────────────────────────
// AUTHOR  : Md. Mainul Islam
// OWNER   : MAINUL-X
// GITHUB  : M41NUL → https://github.com/M41NUL
// WHATSAPP: +8801308850528
// TELEGRAM: t.me/mdmainulislaminfo
// © MAINUL-X  All Rights Reserved
// ────────────────────────────────────────────────────────────────────

import admin from 'firebase-admin';

let db = null;

export function initFirebase() {
  if (admin.apps.length) return admin.database();

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  db = admin.database();
  console.log('[Firebase] Connected to Realtime Database');
  return db;
}

export function getDB() {
  if (!db) return initFirebase();
  return db;
}

// ── CRUD helpers ──────────────────────────────────────────────────

export async function fbGet(path) {
  const snap = await getDB().ref(path).once('value');
  return snap.val();
}

export async function fbSet(path, data) {
  await getDB().ref(path).set(data);
}

export async function fbUpdate(path, data) {
  await getDB().ref(path).update(data);
}

export async function fbPush(path, data) {
  const ref = await getDB().ref(path).push(data);
  return ref.key;
}

export async function fbDelete(path) {
  await getDB().ref(path).remove();
}

export function fbListen(path, callback) {
  getDB().ref(path).on('value', snap => callback(snap.val()));
}
