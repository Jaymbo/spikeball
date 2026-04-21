'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  userId: string;
  username: string;
  isAdmin: boolean;
  requiresPasswordChange: boolean;
}

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'check'],
    queryFn: async () => {
      const res = await fetch('/api/auth/check', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error('Not authenticated');
      }
      const data: AuthResponse = await res.json();
      return data.user;
    },
    retry: false,
    refetchInterval: 1000 * 60 * 5, // Alle 5 Minuten prüfen (statt ständig)
    refetchOnWindowFocus: true, // Bei Tab-Wechsel prüfen
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout: logoutMutation.mutate,
  };
}