---
title: React Query Implementation - Polling Optimization
tags: [react-query, performance, polling, optimization, hooks, caching]
---

# PROBLEM
Excessive polling of API endpoints (`/api/auth/check`, `/api/friends/pending-count`, `/api/players/current-player`) causing high server load and unnecessary database queries. The application was making multiple requests per second even when data hadn't changed.

# LÖSUNG
Implemented React Query (TanStack Query) to replace manual polling with intelligent data fetching, caching, and optimistic updates.

1. Created QueryClient Provider with optimized defaults
2. Created custom hooks for Auth, Players, and Friends
3. Refactored all components to use React Query hooks
4. Implemented optimistic updates for friend requests

# CODE / COMMANDS

## Files Created

### `src/lib/query-client.tsx`
```typescript
'use client';

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 Minuten - Daten gelten als frisch
            gcTime: 1000 * 60 * 10, // 10 Minuten - Cache behalten
            refetchOnWindowFocus: false, // Nicht bei Fokus neu laden
            refetchOnReconnect: true, // Bei Reconnect neu laden
            retry: 1, // Einmal retry bei Fehlern
          },
        },
      })
  );

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
}
```

### `src/hooks/use-auth.ts`
```typescript
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
```

### `src/hooks/use-players.ts`
```typescript
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
```

### `src/hooks/use-friends.ts`
```typescript
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
```

## Files Modified

### `src/app/layout.tsx`
Added QueryClientProvider wrapper around the entire app.

### `src/app/page.tsx`
- Removed all manual polling (setInterval, useEffect with fetch)
- Replaced with useAuth, usePlayers, usePendingFriendRequests hooks
- Simplified state management

### `src/components/FeatureRequestChatWidget.tsx`
- Replaced manual auth check with useAuth hook

### `src/components/friends/FriendRequests.tsx`
- Added useFriendRequestMutation for optimistic updates
- Instant UI feedback when accepting/rejecting friend requests

### `src/app/page-auth.tsx`
- Replaced manual auth check with useAuth hook

# SHELL OUTPUT / ERROR

No errors encountered during implementation.

# WEITERE RESOURCEN
- React Query Documentation: https://tanstack.com/query/latest
- TanStack Query GitHub: https://github.com/TanStack/query
- Related architecture doc: `docs/architecture-replace-polling-with-websockets.md`
- Related polling analysis: `docs/old-files/prisma-query-spam-in-dev-mode.md`
---