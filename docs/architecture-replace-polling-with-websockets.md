---
title: Replace Polling with WebSocket/SSE for Realtime Updates
tags: [architecture, websocket, sse, performance, scalability, polling]
---

# PROBLEM
Polling-basierte API-Endpoints (`/api/auth/check`, `/api/friends/pending-count`, `/api/players/current-player`) werden sehr häufig aufgerufen (mehrere Requests pro Sekunde pro User). Das verursacht hohe Server-Last, unnötigen DB-Traffic und ist schlecht skalierbar.

Die Endpoints ändern sich oft nicht, werden aber trotzdem gefragmentiert abgefragt.

# LÖSUNG
1. **Erkenne Polling-Patterns**: Suche nach Endpoints, die in regelmäßigen Intervallen aufgerufen werden
2. **Wähle die richtige Technologie**:
   - **WebSocket** für bidirektionale Kommunikation (Chat, Live-Spiele)
   - **Server-Sent Events (SSE)** für unidirektionale Server→Client Updates (Notifications, Status)
   - **React Queries / SWR** für Client-Side Caching + Optimistic Updates
3. **Implementiere Event-basierte Updates**: Server pusht Updates nur wenn es Änderungen gibt

# CODE / COMMANDS

## Option A: Server-Sent Events (SSE) mit Next.js Route Handler

**Vorteil:** Einfach, HTTP-basiert, unidirektional

```typescript
// src/app/api/events/route.ts
import { NextRequest } from 'next/server';
import { eventEmitter } from '@/lib/event-emitter';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // Event-Listener anhängen
      eventEmitter.on('friend-request', send);
      eventEmitter.on('auth-change', send);

      // Ping für Keep-Alive (alle 30s)
      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, 30000);

      // Cleanup bei Disconnect
      req.signal.addEventListener('abort', () => {
        eventEmitter.off('friend-request', send);
        eventEmitter.off('auth-change', send);
        clearInterval(pingInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

## Option B: WebSocket mit Socket.io (Node.js Server)

**Vorteil:** Bidirektional, Framing built-in, Raum-basiert

```typescript
// src/lib/socket.ts
import { Server } from 'socket.io';
import { NextApiRequest } from 'next';
import { Server as HTTPServer } from 'http';

export const initSocket = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
  });

  io.on('connection', (socket) => {
    console.log('Client verbunden:', socket.id);

    // User-Channel joinen
    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client getrennt:', socket.id);
    });
  });

  return io;
};

// Events senden (wo immer Änderungen passieren)
export const notifyFriendRequest = (userId: string, count: number) => {
  io.to(`user:${userId}`).emit('friend-request:updated', count);
};

export const notifyAuthChange = (userId: string, isValid: boolean) => {
  io.to(`user:${userId}`).emit('auth:changed', isValid);
};
```

## Option C: React Query / SWR mit Optimistic Updates

**Vorteil:** Client-Side Caching, keine Server-Änderung nötig

```typescript
// hooks/useFriendRequests.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Polling reduzieren auf 30s (statt 1s)
export const useFriendRequests = () => {
  return useQuery({
    queryKey: ['friends', 'pending-count'],
    queryFn: () => api.get('/api/friends/pending-count').then(r => r.data),
    staleTime: 30000, // 30 Sekunden als "frisch" betrachten
    refetchInterval: 30000, // Nur alle 30s neu fetchen
  });
};

// Optimistic Update bei neuen Anfrage
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.post('/api/friends/request', { userId }),
    onMutate: async () => {
      // Alte Daten cache-ten
      await queryClient.cancelQueries(['friends', 'pending-count']);
      const previous = queryClient.getQueryData(['friends', 'pending-count']);
      
      // UI sofort aktualisieren (Optimistic)
      queryClient.setQueryData(['friends', 'pending-count'], (old: number) => old + 1);
      
      return { previous };
    },
    onError: (err, variables, context) => {
      // Bei Fehler rollback
      queryClient.setQueryData(['friends', 'pending-count'], context.previous);
    },
    onSettled: () => {
      // Server-Sync
      queryClient.invalidateQueries(['friends', 'pending-count']);
    },
  });
};
```

# SHELL OUTPUT / ERROR

**Vorher (Polling - ineffizient):**
```
GET /api/friends/pending-count 200 in 31ms
GET /api/players/current-player 200 in 31ms
GET /api/auth/check?t=1776198976568 200 in 29ms
GET /api/friends/pending-count 200 in 31ms
GET /api/players/current-player 200 in 32ms
GET /api/auth/check?t=1776198976684 200 in 31ms
... (fortlaufend ohne Unterbrechung)
```

**Nachher (SSE - nur bei Änderungen):**
```
# Verbindungsaufbau (einmalig)
GET /api/events 200 in 45ms

# Event-Stream (nur wenn was passiert)
data: {"type":"friend-request","count":1}

: ping (Keep-Alive alle 30s)

data: {"type":"auth-check","expired":false}
```

# WEITERE RESOURCEN
- Polling-Nachweis-Datei: `docs/old-files/prisma-query-spam-in-dev-mode.md`
- SSE MDN: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- Socket.io Docs: https://socket.io/docs/
- React Query: https://tanstack.com/query/latest
- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
---