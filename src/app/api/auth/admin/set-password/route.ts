import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// POST /api/auth/admin/set-password
// Admin kann Passwort für Spieler setzen
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin-Berechtigung erforderlich' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'userId und newPassword erforderlich' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashPassword(newPassword),
        requiresPasswordChange: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Passwort gesetzt. Benutzer muss es beim nächsten Login ändern.',
    });
  } catch (error) {
    console.error('Admin set password error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Setzen des Passworts' },
      { status: 500 }
    );
  }
}
