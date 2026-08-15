import crypto from 'node:crypto';

const COOKIE_NAME = 'tudor_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 4;
const revokedSessions = new Map();

function base64urlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64urlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Session configuration is unavailable');
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function getCookie(req, name) {
  const cookies = String(req.headers?.cookie || '').split(';');
  const cookie = cookies.find((item) => item.trim().startsWith(`${name}=`));
  return cookie ? cookie.trim().slice(name.length + 1) : '';
}

function secureCookieAttributes(maxAge = SESSION_TTL_SECONDS) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return [`Path=/`, 'HttpOnly', 'SameSite=Strict', ...(secure ? ['Secure'] : []), `Max-Age=${maxAge}`].join('; ');
}

function cleanupRevokedSessions(now = Date.now() / 1000) {
  for (const [id, expiresAt] of revokedSessions) {
    if (expiresAt <= now) revokedSessions.delete(id);
  }
}

export function createSessionCookie() {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64urlEncode(JSON.stringify({
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    jti: crypto.randomBytes(24).toString('base64url')
  }));
  return `${COOKIE_NAME}=${payload}.${sign(payload)}; ${secureCookieAttributes()}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; ${secureCookieAttributes(0)}`;
}

export function getValidSession(req) {
  cleanupRevokedSessions();
  const token = getCookie(req, COOKIE_NAME);
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  const supplied = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;

  try {
    const session = JSON.parse(base64urlDecode(payload));
    const now = Math.floor(Date.now() / 1000);
    if (!session?.jti || !Number.isInteger(session.exp) || session.exp <= now || revokedSessions.has(session.jti)) return null;
    return session;
  } catch {
    return null;
  }
}

export function requireAuthenticatedRequest(req, res) {
  const session = getValidSession(req);
  if (!session) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (!origin || !host || new URL(origin).host !== host) {
    res.status(403).json({ error: 'Invalid request origin' });
    return null;
  }
  return session;
}

export function revokeSession(req) {
  const session = getValidSession(req);
  if (session) revokedSessions.set(session.jti, session.exp);
}

export function verifyPassword(password) {
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!storedHash || typeof password !== 'string' || password.length > 1024) return false;

  // Expected format: pbkdf2$sha512$600000$base64url-salt$base64url-derived-key
  const [algorithm, digest, iterationsText, salt, expectedHash] = storedHash.split('$');
  const iterations = Number(iterationsText);
  if (algorithm !== 'pbkdf2' || digest !== 'sha512' || !Number.isInteger(iterations) || iterations < 210000 || !salt || !expectedHash) {
    return false;
  }

  try {
    const expected = Buffer.from(expectedHash, 'base64url');
    const derived = crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64url'), iterations, expected.length, digest);
    return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

export const LOGIN_RATE_LIMIT = { maxFailures: 5, windowMs: 15 * 60 * 1000 };
