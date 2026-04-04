import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'spikeball-secret-key-change-in-production'
);
const TOKEN_EXPIRE = '7d';
const COOKIE_NAME = 'auth-token';

export interface JWTPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
}

// Hash password with bcrypt-like approach (simple for SQLite)
export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, 'spikeball-salt', 1000, 64, 'sha512')
    .toString('hex');
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  const rehash = crypto
    .pbkdf2Sync(password, 'spikeball-salt', 1000, 64, 'sha512')
    .toString('hex');
  return rehash === hash;
}

// Create JWT token
export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRE)
    .sign(JWT_SECRET);
  return token;
}

// Verify and decode JWT
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

// Get auth token from cookie
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

// Clear auth cookie
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get current user from cookie
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}
