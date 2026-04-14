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