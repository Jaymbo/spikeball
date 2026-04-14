---
title: JWT Authentication with JOSE Library
tags: [jwt, authentication, jose, nextjs, cookies, security]
---

# PROBLEM
Sichere JWT-basierte Authentifizierung in Next.js App Router mit Cookie-basierten Sessions, die sowohl in Entwicklung als auch Production funktioniert.

# LÖSUNG
1. Verwende die `jose` Bibliothek für JWT (moderner als jsonwebtoken, besser für Next.js)
2. Implementiere pbkdf2Sync für Passwort-Hashing (ersetzt bcrypt für SQLite)
3. HttpOnly Cookies für Token-Speicherung (nicht localStorage für mehr Sicherheit)
4. Environment-gerechte Cookie-Flags (secure nur in production)

# CODE / COMMANDS
```typescript
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// JWT Secret aus Environment (NOT NULL für Production!)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'spikeball-secret-key-change-in-production'
);

// Passwort Hashing mit pbkdf2 (für SQLite-Alternative zu bcrypt)
export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, 'spikeball-salt', 1000, 64, 'sha512')
    .toString('hex');
}

// Passwort Verifikation
export function verifyPassword(password: string, hash: string): boolean {
  const rehash = crypto
    .pbkdf2Sync(password, 'spikeball-salt', 1000, 64, 'sha512')
    .toString('hex');
  return rehash === hash;
}

// JWT Token erstellen mit JOSE (mehr typings, kleiner bundle)
export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// JWT token verifizieren
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET_SECRET);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Session Cookie setzen (HttpOnly für XSS-Schutz)
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true, // Schutz vor JavaScript Zugriff
    secure: process.env.NODE_ENV === 'production', // Nur HTTPS in Prod
    sameSite: 'lax', // CSRF-Schutz
    maxAge: 7 * 24 * 60 * 60, // 7 Tage
    path: '/',
  });
}

// Token aus Cookie extrahieren
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value || null;
}

// Cookie löschen bei Logout
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

// Komprimierte Helper: Token verifizieren und Benutzerdaten extrahieren
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
}
```

# SHELL OUTPUT / ERROR
```
Error: JWTVerificationFailed: token verification failed
TypeError: Cannot read properties of undefined (reading 'get')
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/lib/auth.ts`
- JOSE Library: <https://github.com/panva/jose>
- Next.js Authentication: <https://nextjs.org/docs/app/building-your-application/authentication>
---