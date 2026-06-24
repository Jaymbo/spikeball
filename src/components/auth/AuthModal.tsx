'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const loginUsernameRef = useRef<HTMLInputElement>(null);
  const registerUsernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (activeTab === 'login') {
        loginUsernameRef.current?.focus();
      } else {
        registerUsernameRef.current?.focus();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [open, activeTab]);

  const getErrorMessage = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      return data?.error || fallback;
    } catch {
      return fallback;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const message = await getErrorMessage(res, 'Login fehlgeschlagen');
        toast.error(message);
        setFeedback({ type: 'error', message });
        setIsLoading(false);
        return;
      }

      await res.json();
      toast.success('Erfolgreich angemeldet!');
      setFeedback({ type: 'success', message: 'Login erfolgreich.' });
      setUsername('');
      setPassword('');
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      onOpenChange(false);

      if (onSuccess) {
        await onSuccess();
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Anmeldefehler');
      setFeedback({ type: 'error', message: 'Anmeldefehler' });
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (password !== passwordConfirm) {
      toast.error('Passwörter stimmen nicht überein');
      setFeedback({ type: 'error', message: 'Passwörter stimmen nicht überein' });
      return;
    }

    if (password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein');
      setFeedback({ type: 'error', message: 'Passwort muss mindestens 6 Zeichen lang sein' });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, passwordConfirm }),
        credentials: 'include',
      });

      if (!res.ok) {
        const message = await getErrorMessage(res, 'Registrierung fehlgeschlagen');
        toast.error(message);
        setFeedback({ type: 'error', message });
        setIsLoading(false);
        return;
      }

      await res.json();
      toast.success('Erfolgreich registriert!');
      setFeedback({ type: 'success', message: 'Registrierung erfolgreich.' });
      setUsername('');
      setPassword('');
      setPasswordConfirm('');
      onOpenChange(false);

      if (onSuccess) {
        await onSuccess();
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Registrierungsfehler');
      setFeedback({ type: 'error', message: 'Registrierungsfehler' });
      setIsLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setFeedback(null);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Willkommen bei Spikeball ELO</DialogTitle>
          <DialogDescription>Melde dich an oder erstelle ein neues Konto</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Anmelden</TabsTrigger>
            <TabsTrigger value="register">Registrieren</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Benutzername</label>
                <Input
                  ref={loginUsernameRef}
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
              </Button>

              {feedback && activeTab === 'login' && (
                <div className={`text-sm text-center ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {feedback.message}
                </div>
              )}
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Benutzername</label>
                <Input
                  ref={registerUsernameRef}
                  type="text"
                  placeholder="Wähle einen Namen"
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Wird registriert...' : 'Registrieren'}
              </Button>

              {feedback && activeTab === 'register' && (
                <div className={`text-sm text-center ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {feedback.message}
                </div>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
