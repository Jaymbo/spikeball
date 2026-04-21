'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PendingCountResponse {
  count: number;
}

export function usePendingFriendRequests() {
  return useQuery({
    queryKey: ['friends', 'pending-count'],
    queryFn: async () => {
      const res = await fetch('/api/friends/pending-count');
      if (!res.ok) {
        throw new Error('Failed to fetch pending count');
      }
      return res.json() as Promise<PendingCountResponse>;
    },
    staleTime: 1000 * 30, // 30 Sekunden - Notifications sollten aktuell sein
    refetchInterval: 1000 * 60, // Alle 60 Sekunden prüfen (statt 30s)
    refetchOnWindowFocus: true, // Bei Tab-Wechsel prüfen
  });
}

export function useInvalidateFriends() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['friends'] });
}

// Optimistic Update Helper für Friend-Requests
export function useFriendRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, requestId }: { action: 'accept' | 'reject'; requestId: string }) => {
    const res = await fetch(`/api/friends/${requestId}`, {
      method: action === 'accept' ? 'PATCH' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      throw new Error('Failed to process friend request');
    }
    return res.json();
  },
  onMutate: async () => {
    // Optimistic Update: Count sofort verringern
    await queryClient.cancelQueries({ queryKey: ['friends', 'pending-count'] });
    const previous = queryClient.getQueryData<PendingCountResponse>(['friends', 'pending-count']);
    queryClient.setQueryData<PendingCountResponse>(['friends', 'pending-count'], (old) => ({
      count: Math.max(0, (old?.count || 0) - 1),
    }));
    return { previous };
  },
  onError: (err, variables, context) => {
    // Bei Fehler rollback
    if (context?.previous) {
      queryClient.setQueryData(['friends', 'pending-count'], context.previous);
    }
  },
  onSettled: () => {
    // Server-Sync
    queryClient.invalidateQueries({ queryKey: ['friends'] });
  },
  });
}