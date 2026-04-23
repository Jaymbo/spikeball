import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET
);

// Validate required environment variables on import (fail fast)
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. This is a security requirement.');
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('WARN: JWT_SECRET should be at least 32 characters long for production security');
}

const TOKEN_EXPIRE = '7d';
const COOKIE_NAME = 'auth-token';

// Old system constants (for migration)
const OLD_SALT = 'spikeball-salt';
const OLD_ITERATIONS = 1000;
const OLD_KEY_LENGTH = 64;
const OLD_DIGEST = 'sha512';

export interface JWTPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  [key: string]: any; // Index signature for jose compatibility
}

/**
 * Detect if a hash is bcrypt format (starts with $2a$, $2b$, or $2y$)
 */
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}

/**
 * Hash password using OLD crypto-based system (for migration detection only)
 * DO NOT use for new passwords!
 */
function hashPasswordOld(password: string): string {
  return crypto
    .pbkdf2Sync(password, OLD_SALT, OLD_ITERATIONS, OLD_KEY_LENGTH, OLD_DIGEST)
    .toString('hex');
}

/**
 * Hash password using bcrypt (industry standard)
 * - Automatically generates and includes unique salt per password
 * - Cost factor 12 for good security/performance balance
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash (supports BOTH old and new formats)
 * Returns: { isValid: boolean, needsMigration: boolean }
 * - needsMigration: true if old hash format detected and password is valid
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Try bcrypt first (new system)
  if (isBcryptHash(hash)) {
    return bcrypt.compare(password, hash);
  }

  // Fall back to old crypto-based system (for migration)
  const oldHash = hashPasswordOld(password);
  return oldHash === hash;
}

/**
 * Check if a password hash needs migration to bcrypt
 */
export function needsPasswordMigration(hash: string): boolean {
  return !isBcryptHash(hash);
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
  const isSecure = process.env.NODE_ENV === 'production';
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
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
