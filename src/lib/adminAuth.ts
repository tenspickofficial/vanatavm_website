import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session';

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET environment variable is not configured');
  }
  return secret;
}

export function createSessionToken(username: string): string {
  const secret = getSecret();
  const timestamp = Date.now().toString();
  const payload = `${username}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

export function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [username, timestamp, hmac] = decoded.split(':');
    if (!username || !timestamp || !hmac) return false;

    const ageMs = Date.now() - parseInt(timestamp, 10);
    if (isNaN(ageMs) || ageMs > 7 * 24 * 60 * 60 * 1000) return false;

    const expectedHmac = crypto
      .createHmac('sha256', getSecret())
      .update(`${username}:${timestamp}`)
      .digest('hex');
    const hmacBuf = Buffer.from(hmac);
    const expectedBuf = Buffer.from(expectedHmac);
    if (hmacBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(hmacBuf, expectedBuf);
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return false;
  return verifySessionToken(sessionCookie.value);
}

export async function setAdminSession(username: string) {
  const token = createSessionToken(username);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function checkCredentials(user: string, pass: string): boolean {
  const validUser = process.env.ADMIN_USERNAME || 'admin';
  const validPass = process.env.ADMIN_PASSWORD;
  if (!validPass) {
    console.error('ADMIN_PASSWORD environment variable is not configured');
    return false;
  }

  const userBuf = Buffer.from(user);
  const validUserBuf = Buffer.from(validUser);
  const passBuf = Buffer.from(pass);
  const validPassBuf = Buffer.from(validPass);

  const userMatch =
    userBuf.length === validUserBuf.length && crypto.timingSafeEqual(userBuf, validUserBuf);
  const passMatch =
    passBuf.length === validPassBuf.length && crypto.timingSafeEqual(passBuf, validPassBuf);

  return userMatch && passMatch;
}
