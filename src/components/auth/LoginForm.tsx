'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Login fehlgeschlagen');
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      if (data.user.requiresPasswordChange) {
        // Redirect to password change
        router.push('/change-password');
      } else {
        toast.success('Erfolgreich angemeldet!');
        onSuccess?.();
        router.refresh();
      }
    } catch (error) {
      toast.error('Anmeldefehler');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, passwordConfirm }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Registrierung fehlgeschlagen');
        setIsLoading(false);
        return;
      }

      toast.success('Erfolgreich registriert!');
      setUsername('');
      setPassword('');
      setPasswordConfirm('');
      setShowRegister(false);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error('Registrierungsfehler');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{showRegister ? 'Registrieren' : 'Anmelden'}</CardTitle>
          <CardDescription>
            {showRegister
              ? 'Erstelle ein neues Konto, um zu spielen'
              : 'Melde dich an, um dein Profil zu verwalten'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={showRegister ? handleRegister : handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Benutzername</label>
              <Input
                type="text"
                placeholder="Benutzername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Passwort</label>
              <Input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {showRegister && (
              <div>
                <label className="text-sm font-medium">Passwort wiederholen</label>
                <Input
                  type="password"
                  placeholder="Passwort wiederholen"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? 'Wird verarbeitet...'
                : showRegister
                  ? 'Registrieren'
                  : 'Anmelden'}
            </Button>

            <div className="text-center text-sm">
              {showRegister ? (
                <>
                  Hast du bereits ein Konto?{' '}
                  <button
                    type="button"
                    onClick={() => setShowRegister(false)}
                    className="text-blue-500 hover:underline"
                  >
                    Melde dich an
                  </button>
                </>
              ) : (
                <>
                  Noch kein Konto?{' '}
                  <button
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="text-blue-500 hover:underline"
                  >
                    Registriere dich
                  </button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
