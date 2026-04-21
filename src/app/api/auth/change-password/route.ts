import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, newPasswordConfirm } = body;

    if (!newPassword || !newPasswordConfirm) {
      return NextResponse.json(
        { error: 'Neues Passwort erforderlich' },
        { status: 400 }
      );
    }

    if (newPassword !== newPasswordConfirm) {
      return NextResponse.json(
        { error: 'Passwörter stimmen nicht überein' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // Verify current password if user is not on first login
    if (currentPassword) {
      const dbUser = await db.user.findUnique({
        where: { id: user.userId },
      });

      if (!dbUser) {
        return NextResponse.json(
          { error: 'Benutzer nicht gefunden' },
          { status: 404 }
        );
      }

      const isPasswordValid = await verifyPassword(currentPassword, dbUser.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Aktuelles Passwort ist falsch' },
          { status: 401 }
        );
      }
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(newPassword);
    
    await db.user.update({
      where: { id: user.userId },
      data: {
        passwordHash,
        requiresPasswordChange: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Passwort erfolgreich geändert',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Ändern des Passworts' },
      { status: 500 }
    );
  }
}
