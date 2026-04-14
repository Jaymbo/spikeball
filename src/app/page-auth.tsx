'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import SpikeballPage from './spikeball-page';
import { useAuth } from '@/hooks/use-auth';

interface CurrentUser {
  id: string;
  username: string;
  isAdmin: boolean;
  requiresPasswordChange: boolean;
}

export default function Page() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (user?.requiresPasswordChange) {
      setShowPasswordDialog(true);
    }
  }, [user?.requiresPasswordChange]);

  const handleLogout = async () => {
    logout();
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => router.refresh()} />;
  }

  return (
    <>
      <SpikeballPage user={user} isAdmin={user.isAdmin} />

      {/* Logout button in top right */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        title={`Angemeldet als ${user.username}`}
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Abmelden</span>
      </button>

      {/* Benutzerinfozeile */}
      <div className="fixed bottom-4 right-4 z-50 text-xs text-slate-500 bg-slate-900 bg-opacity-70 px-3 py-2 rounded border border-slate-700">
        {user.username} {user.isAdmin && <span className="text-amber-400">(Admin)</span>}
      </div>

      <ChangePasswordDialog
        open={showPasswordDialog}
        isFirstLogin={true}
        onSuccess={() => {
          setShowPasswordDialog(false);
        }}
      />
    </>
  );
}