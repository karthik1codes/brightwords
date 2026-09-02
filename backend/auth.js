const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '369705995460-d2f937r1bj3963upbmob113ngkf5v6og.apps.googleusercontent.com';
const SESSION_COOKIE = 'brightwords_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be configured in production.');
  }
  // A local-only fallback keeps development simple while making sessions expire on restart.
  return process.env.LOCAL_SESSION_SECRET || 'brightwords-local-development-session-secret';
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function createSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.sub,
    email: user.email,
    name: user.name || '',
    picture: user.picture || '',
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index > 0) {
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      cookies[key] = decodeURIComponent(value);
    }
    return cookies;
  }, {});
}

function readSession(req) {
  try {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (!token) return null;
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    const expected = sign(encoded);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.sub || !payload.email || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  return [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${maxAge}`,
  ].filter(Boolean).join('; ');
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ].filter(Boolean);
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', cookieOptions(0));
}

function publicUser(session) {
  return {
    sub: session.sub,
    email: session.email,
    name: session.name || '',
    picture: session.picture || '',
  };
}

async function verifyGoogleCredential(credential) {
  if (typeof credential !== 'string' || credential.length < 20 || credential.length > 8192) {
    throw new Error('Invalid Google credential.');
  }
  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new Error('Google account email is not verified.');
  }
  return publicUser(payload);
}

async function googleLogin(req, res) {
  try {
    const user = await verifyGoogleCredential(req.body?.credential);
    setSessionCookie(res, createSession(user));
    res.json({ user });
  } catch (error) {
    console.warn('Google sign-in rejected:', error.message);
    res.status(401).json({ error: 'Google sign-in could not be verified.' });
  }
}

function getSession(req, res) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Not signed in.' });
  return res.json({ user: publicUser(session) });
}

function logout(req, res) {
  clearSessionCookie(res);
  res.status(204).end();
}

function requireSession(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Please sign in to continue.' });
  req.user = publicUser(session);
  return next();
}

module.exports = { googleLogin, getSession, logout, requireSession, publicUser };
