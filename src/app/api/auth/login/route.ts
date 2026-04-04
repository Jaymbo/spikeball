import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';

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

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
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
        requiresPasswordChange: user.requiresPasswordChange,
      },
    });

    const isHttps =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';
    const useSecureCookie =
      process.env.AUTH_COOKIE_SECURE === 'true' ||
      (process.env.NODE_ENV === 'production' && isHttps);

    // Set the cookie in the response
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
