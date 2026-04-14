---
title: Prisma Schema Corruption and Profile Picture Field
tags: [prisma, migration, typescript, database]
---
# PROBLEM
Mehrere TypeScript-Fehler wegen fehlender Datenbankfelder und korrupter Konfigurationsdateien. Die Prisma Schema-Datei enthielt keine validen Prisma-Definitionen, sondern stattdessen englischen Beschreibungstext ("The user wants to apply a specific edit to a Prisma schema file..."). Dies führte zu Fehlern wie "Cannot find module '@/lib/prisma'", "Property 'profilePicture' does not exist" und "Type 'string | null | undefined' is not assignable to type 'string'".

# LÖSUNG
1. Die korrupte Prisma Schema-Datei (`prisma/schema.prisma`) wurde gelöscht und mit korrekten Prisma-Definitionen neu erstellt.
2. Das Feld `profilePicture String?` wurde zum Player Model hinzugefügt.
3. Alle falschen Imports von `@/lib/prisma` wurden zu `@/lib/db` korrigiert.
4. TypeScript Interfaces wurden aktualisiert, um `profilePicture` zu unterstützen.
5. Prisma Migration wurde ausgeführt, um die Datenbank zu aktualisieren.

# CODE / COMMANDS
```bash
# Datei löschen und neu erstellen
cd spikeball
rm prisma/schema.prisma
# (dann neue Datei mit korrektem Inhalt erstellen)

# Prisma Client neu generieren
npx prisma generate

# Migration ausführen
npx prisma migrate dev --name add_profile_picture
```

# TypeScript Interface Updates
```typescript
// spikeball/src/components/profile/PlayerProfile.tsx
interface GamePlayer {
  id: string;
  name: string;
  eloRating: number;
  profilePicture?: string;  // Added this field
}
```

```typescript
// spikeball/src/components/spikeball/PlayersTabUpdated.tsx
interface Player {
  // ...
  profilePicture?: string;  // Changed from `string | null` to `string`
}
```

# Import Corrections
```typescript
// spikeball/src/app/api/players/[id]/route.ts
// Before:
import { prisma } from '@/lib/prisma';
// After:
import { db } from '@/lib/db';

// Replace all:
const player = await prisma.player.findUnique({...})
// With:
const player = await db.player.findUnique({...})
```

# SHELL OUTPUT / ERROR
```
TS2307: Cannot find module '@/lib/prisma' or its corresponding type declarations.
TS2339: Property 'profilePicture' does not exist on type 'Player'.
TS2322: Type 'string | null | undefined' is not assignable to type 'string'.
```

# WEITERE RESOURCEN
- Datei: `spikeball/prisma/schema.prisma`
- Datei: `spikeball/src/lib/db.ts`
- API Routes: `spikeball/src/app/api/players/[id]/route.ts`, `spikeball/src/app/api/upload/profile-picture/route.ts`
- Components: `spikeball/src/components/profile/PlayerProfile.tsx`, `spikeball/src/components/spikeball/PlayersTabUpdated.tsx`
---