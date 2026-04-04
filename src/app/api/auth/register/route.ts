import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, passwordConfirm } = body;

    if (!username || !password || !passwordConfirm) {
      return NextResponse.json(
        { error: 'Alle Felder erforderlich' },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: 'Passwörter stimmen nicht überein' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Benutzername existiert bereits' },
        { status: 409 }
      );
    }

    // Check if player name already exists
    const existingPlayer = await db.player.findUnique({
      where: { name: username },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Name existiert bereits' },
        { status: 409 }
      );
    }

    // Create user and player in transaction
    const user = await db.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        isAdmin: false,
        requiresPasswordChange: false,
      },
    });

    const player = await db.player.create({
      data: {
        name: username,
        userId: user.id,
      },
    });

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
      player: {
        id: player.id,
        name: player.name,
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
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Registrierungsfehler' },
      { status: 500 }
    );
  }
}
