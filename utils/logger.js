// ── MAINUL-X WA Bot · Logger ─────────────────────────────────────────
// AUTHOR  : Md. Mainul Islam | OWNER : MAINUL-X | GITHUB : M41NUL
// © MAINUL-X  All Rights Reserved
// ────────────────────────────────────────────────────────────────────

const COLORS = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  white:  '\x1b[37m',
};

function timestamp() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function log(level, tag, msg) {
  const color = { INFO: COLORS.green, WARN: COLORS.yellow, ERROR: COLORS.red, SYS: COLORS.cyan }[level] || COLORS.white;
  console.log(`${COLORS.gray}[${timestamp()}]${COLORS.reset} ${color}[${level}]${COLORS.reset} ${COLORS.white}${tag}${COLORS.reset} ${msg}`);

  // Push to in-memory log buffer for dashboard
  logBuffer.push({ time: timestamp(), level, tag, msg });
  if (logBuffer.length > 100) logBuffer.shift();
}

export const logBuffer = [];

export const logger = {
  info:  (tag, msg) => log('INFO',  tag, msg),
  warn:  (tag, msg) => log('WARN',  tag, msg),
  error: (tag, msg) => log('ERROR', tag, msg),
  sys:   (tag, msg) => log('SYS',   tag, msg),
};
