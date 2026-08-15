import { createSessionCookie, LOGIN_RATE_LIMIT, verifyPassword } from './auth.js';

const failuresByIp = new Map();

function clientKey(req) {
  return String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function isRateLimited(key, now) {
  const attempt = failuresByIp.get(key);
  if (!attempt || now - attempt.startedAt > LOGIN_RATE_LIMIT.windowMs) {
    failuresByIp.delete(key);
    return false;
  }
  return attempt.count >= LOGIN_RATE_LIMIT.maxFailures;
}

function recordFailure(key, now) {
  const attempt = failuresByIp.get(key);
  if (!attempt || now - attempt.startedAt > LOGIN_RATE_LIMIT.windowMs) {
    failuresByIp.set(key, { count: 1, startedAt: now });
  } else {
    attempt.count += 1;
  }
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  if (isProduction && req.headers?.['x-forwarded-proto'] !== 'https') {
    return res.status(400).json({ error: 'Secure connection required' });
  }

  const key = clientKey(req);
  const now = Date.now();
  if (isRateLimited(key, now)) return res.status(429).json({ error: 'Too many login attempts. Try again later.' });

  if (!verifyPassword(req.body?.password)) {
    recordFailure(key, now);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  failuresByIp.delete(key);
  res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ ok: true });
}
