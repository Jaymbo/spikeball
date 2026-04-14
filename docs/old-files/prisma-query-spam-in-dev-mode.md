---
title: Prisma Query Spam im Next.js Dev Mode abschalten
tags: [nextjs, prisma, logging, performance, dev-mode]
---
# PROBLEM
Bei `npm run dev` wird das Terminal mit Prisma SQL-Query Logs zugespammt. Polling-basierte Endpoints (`/api/auth/check`, `/api/friends/pending-count`, `/api/players/current-player`) werden sehr häufig aufgerufen und verursachen SQL-Logs. Das Terminal ist unübersichtlich und schwer zu debuggen.

# LÖSUNG
1. Prisma Query Logging abschalten oder reduzieren
2. Nur Fehler loggen statt aller Queries
3. Oder Prisma Logging für Prod/Dev konfigurieren

# CODE / COMMANDS

## Schritt 1: Prisma Client Singleton anpassen (`src/lib/db.ts`)

**Problematisch (aktuell):**
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient(
    // Hier passiert das Query Logging!
    // Prisma loggt ALLE standardmäßig
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Lösung A: Logging komplett abschalten (empfohlen für Dev):**
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'], // Nur Fehler loggen, keine Queries
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Lösung B: Sehr ausführliches Logging (nur für Debugging):**
```typescript
new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Lösung C: Custom Query Logging mit Filter (best für Debugging):**
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

// Optional: Custom Query Handling (sehr langsam/bloated)
// db.$on('query', (e) => {
//   console.log('Query: ' + e.query);
//   console.log('Params: ' + e.params);
//   console.log('Duration: ' + e.duration + 'ms');
// });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

## Schritt 2: Alternative - Environment Variable gesteuert

Für flexible Konfiguration kann ein environment variable verwendet werden:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

Dann in `.env.local`:
```bash
# Für Query-Logging: true, sonst false/false oder weglassen
PRISMA_LOG_QUERIES=false
```

# SHELL OUTPUT / ERROR

**Vorher (Spam):**
```
prisma:query SELECT `main`.`Friendship`.`id` FROM `main`.`Friendship` WHERE (`main`.`Friendship`.`receiverId` = ? AND `main`.`Friendship`.`status` = ?) LIMIT ? OFFSET ?) AS `sub`
prisma:query SELECT `main`.`Player`.`id`, `main`.`Player`.`userId`, ... FROM `main`.`Player` WHERE `main`.`Player`.`userId` = ? LIMIT ? OFFSET ?
GET /api/auth/check?t=1775750416031 200 in 11
prisma:query SELECT COUNT(*) AS `_count$_all` FROM ... 
prisma:query SELECT ... FROM ...
```

**Nachher (sauber):**
```
GET /api/auth/check?t=1775750416031 200 in 11
GET /api/players/current-player 200 in 12
GET /api/friends/pending-count 200 in 14
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/lib/db.ts` (oder wo der Prisma Singleton definiert ist)
- Prisma Logging Docs: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#log

---