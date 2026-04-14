---
title: Prisma Client Singleton Pattern
tags: [prisma, nextjs, database-connection, hot-reload, singleton]
---

# PROBLEM
In Next.js Entwicklungs-Mode mit Hot-Reload wird bei jeder Änderung eine neue Instanz von Prisma Client erstellt. Dies führt zu "Too many connections" Fehlern und Speicherlecks, da Datenbankverbindungen nicht geschlossen werden.

# LÖSUNG
Verwende das Singleton-Pattern mit `globalThis`, um sicherzustellen, dass nur eine Prisma-Client-Instanz existiert.

# CODE / COMMANDS
```typescript
import { PrismaClient } from '@prisma/client'

// globalThis window object für Prisma Singleton
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Singleton Prisma Client
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // Nur für Development logging
  })

// In Development, speichere als globale Variable für Hot-Reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

# SHELL OUTPUT / ERROR
```
PrismaClientInitializationError: Too many connections
Error: Maximum number of connections reached (SQLite: 1)
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/lib/db.ts`
- Prisma Singleton Pattern: <https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices>
---