import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Erfolgreich abgemeldet',
    });

    await clearAuthCookie();
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Abmeldefehler' },
      { status: 500 }
    );
  }
}
