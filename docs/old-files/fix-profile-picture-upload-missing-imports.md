
---
title: Profilbild-Upload funktioniert nicht auf Laptop (versteckte Build-Fehler)
tags: [nextjs, typescript, import-missing, runtime-error, build-error]
---
# PROBLEM
Profilbild-Upload funktionierte auf Handy (Firefox) aber NICHT auf Laptop (Firefox). Die API-Route gab `{"success": true}` zurück, aber das Bild wurde nicht gespeichert (404 auf die Datei). Das Terminal war durch Prisma Query-Spam unübersichtlich.

# LÖSUNG
Das Problem war während eines Refactorings aufgetreten: Die imports in der API-Route waren komplett VERSCHWUNDEN. Der dev-server hat zwar erfolgreich ohne errors kompiliert, aber beim rutime kam dann der `ReferenceError: getCurrentUser is not defined`.

1. Imports zur API-Route wieder hinzugestellt
2. Prisma Query Spam reduziert (nur Fehler loggen statt aller SQL-Queries)
3. TypeScript CSS-Import Warning mit @ts-ignore korrigiert

# CODE / COMMANDS

## Schritt 1: Fehlende Imports wiederherstellen (`src/app/api/upload/profile-picture/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // ...
}
```

## Schritt 2: Prisma Query Spam entfernen/abschalten (`src/lib/db.ts`)

**Problematisch:**
```typescript
new PrismaClient({
  log: ['query'], // Loggt JEGE SQL Query
});
```

**Lösung:**
```typescript
new PrismaClient({
  log: ['error'], // Nur Fehler loggen
});
```

## Schritt 3: TypeScript CSS Import Warning (`src/app/layout.tsx`)

```typescript
// @ts-ignore - CSS hat keine TypeScript-Definitionen
import "./globals.css";
```

# SHELL OUTPUT / ERROR

**Runtime-Error im Terminal (bevor Fix):**
```
=== UPLOAD ERROR ===
Upload error: ReferenceError: getCurrentUser is not defined
at POST (webpack-internal:///(rsc)/./src/app/api/upload/profile-picture/route.ts:8:25)
Error stack: ReferenceError: getCurrentUser is not defined
...
=== END ERROR ===
```

**404 Error im Browser Network Tab die fehlgeleitete Datei:**
```
GET /uploads/profiles/cmndeuhpp0002l0722g7o3g4u-1775748564074.jpg 404 in 1144ms
```

**Terminal AFTER Fix (sauber, mehrere Requests werden in nur 15ms abgearbeitet):**
```
GET /api/auth/check?t=1775750416031 200 in 7ms
GET /api/players/current-player 200 in 7ms
GET /api/friends/pending-count 200 in 11ms
```

# WEITERE RESOURCEN
- API-Route: `spikeball/src/app/api/upload/profile-picture/route.ts`
- Frontend Upload Component: `spikeball/src/components/profile/AvatarUpload.tsx`
- Next.js Dev Server Hot Module Replacement: https://nextjs.org/docs/app/building-your-application/configuring/typescript#typescript-errors

---