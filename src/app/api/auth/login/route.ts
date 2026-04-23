import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createToken, needsPasswordMigration, hashPassword } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Benutzername und Passwort erforderlich' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      // Use timing-safe response to prevent username enumeration
      await bcrypt.compare(password, '$2b$12$invalid.hash.for.timing');
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    // Verify password (supports both old and new formats)
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    // MIGRATION: If old hash detected, migrate to bcrypt immediately
    let needsPasswordChange = user.requiresPasswordChange;
    if (needsPasswordMigration(user.passwordHash)) {
      console.log(`[Password Migration] Migrating user ${user.username} from old hash to bcrypt`);
      
      // Hash with bcrypt and update database
      const newHash = await hashPassword(password);
      await db.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHash,
          requiresPasswordChange: true, // Force password change after migration
        },
      });
      
      needsPasswordChange = true;
    }

    const token = await createToken({
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        requiresPasswordChange: needsPasswordChange,
      },
    });

    const isHttps =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';
    const useSecureCookie =
      process.env.AUTH_COOKIE_SECURE === 'true' ||
      (process.env.NODE_ENV === 'production' && isHttps);

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: useSecureCookie,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Anmeldefehler' },
      { status: 500 }
    );
  }
}
