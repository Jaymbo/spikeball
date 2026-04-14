"---
title: Build Error PlayerProfile Missing Component
tags: [nextjs, build-error, missing-component, component-imports]
---

# PROBLEM
Der Next.js Build-Process mit Fehler `Module not found: Can't resolve '@/components/profile/PlayerProfile'` abgebrochen, da die Komponente in einer Datei importiert wird, aber nicht existiert oder noch nicht erstellt wurde.

# LÖSUNG
1. Prüfe, welche Komponente importiert wird (im Leaderboard.tsx)
2. Erstelle die fehlende Komponente mit korrekten Export
3. Stelle sicher, dass alle API-Endpunkte vorhanden sind, die der Komponente benötigt
4. Definiere alle TypeScript-Interfaces korrekt in derselben Komponente

# CODE / COMMANDS
```bash
# Build durchführen
npm run build

# Wenn Fehler auftritt, prüfe die Import-Pfade
grep -r \"PlayerProfile\" src/

# Wenn Datei fehlt, erstelle sie
touch src/components/profile/PlayerProfile.tsx
```

```tsx
// Beispiel-Komponente PlayerProfile.tsx
\"use client\";

import { useState, useEffect } from \"react\";
import { Card, CardContent, CardHeader, CardTitle } from \"@/components/ui/card\";
import { Button } from \"@/components/ui/button\";
// ... weitere Imports

interface PlayerProfileProps {
  playerId: string;
  isOwnProfile: boolean;
  isAdmin: boolean;
  onClose: () => void;
}

export function PlayerProfile({ playerId, isOwnProfile, isAdmin, onClose }: PlayerProfileProps) {
  // ... Logik
}
```

# SHELL OUTPUT / ERROR
```
▲ Next.js 14.2.35
- Environments: .env
Creating an optimized production build ...
Failed to compile.
./src/components/spikeball/Leaderboard.tsx
Module not found: Can't resolve '@/components/profile/PlayerProfile'
https://nextjs.org/docs/messages/module-not-found
Import trace for requested module:
./src/app/page.tsx
> Build failed because of webpack errors
```

# WEITERE RESOURCEN
- Dateipfade:
  - `spikeball/src/components/spikeball/Leaderboard.tsx` (Import)
  - `spikeball/src/components/profile/PlayerProfile.tsx` (fehlend, jetzt erstellt)
  - `spikeball/src/app/api/players/[id]/games/route.ts` (API für Spiele-Historie)
- Next.js Module Resolution: <https://nextjs.org/docs/architecture/imports-and-exports>

---
"