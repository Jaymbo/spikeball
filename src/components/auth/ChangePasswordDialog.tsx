'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface ChangePasswordDialogProps {
  open: boolean;
  isFirstLogin?: boolean;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, isFirstLogin = false, onSuccess, onOpenChange }: ChangePasswordDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== newPasswordConfirm) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: !isFirstLogin ? currentPassword : undefined,
          newPassword,
          newPasswordConfirm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Fehler beim Ändern des Passworts');
        setIsLoading(false);
        return;
      }

      toast.success('Passwort erfolgreich geändert!');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      onSuccess?.();
      onOpenChange?.(false);
      router.refresh();
    } catch (_error) {
      toast.error('Fehler beim Ändern des Passworts');
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isFirstLogin && !nextOpen) {
      return;
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isFirstLogin}>
        <DialogHeader>
          <DialogTitle>
            {isFirstLogin ? 'Passwort beim ersten Login ändern' : 'Passwort ändern'}
          </DialogTitle>
          <DialogDescription>
            {isFirstLogin
              ? 'Du musst dein Passwort beim ersten Login ändern'
              : 'Änder dein Passwort'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isFirstLogin && (
            <div>
              <label className="text-sm font-medium">Aktuelles Passwort</label>
              <Input
                type="password"
                placeholder="Aktuelles Passwort"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Neues Passwort</label>
            <Input
              type="password"
              placeholder="Neues Passwort"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Passwort wiederholen</label>
            <Input
              type="password"
              placeholder="Passwort wiederholen"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Wird gespeichert...' : 'Passwort ändern'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
