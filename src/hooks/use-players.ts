'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Player {
  id: string;
  name: string;
  eloRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  lastPlayedAt: string | null;
}

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await fetch('/api/players');
      if (!res.ok) {
        throw new Error('Failed to fetch players');
      }
      return res.json() as Promise<Player[]>;
    },
    staleTime: 1000 * 60 * 2, // 2 Minuten - Spielerdaten ändern sich selten
    refetchInterval: 1000 * 60 * 5, // Alle 5 Minuten automatisch aktualisieren
  });
}

export function useInvalidatePlayers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['players'] });
}