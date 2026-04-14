---
title: PlayersTabUpdated Build Failure - Cannot Resolve
tags: [build-error, file-corruption, nextjs, typescript]
---
# PROBLEM
Die Datei `src/components/spikeball/PlayersTabUpdated.tsx` verursacht kontinuierlich Build-Fehler mit der Meldung "Unterminated string constant". Die Datei wurde mehrfach neu erstellt und repariert, aber der Build bleibt fehlerhaft. Die Datei scheint auf dem Server korrupt zu sein oder enthält versteckte Zeichen.

# LÖSUNG
Die Datei muss manuell auf dem Server korrigiert oder aus einer Git-Backup/History wiederhergestellt werden.

```bash
# Option 1: Aus Git wiederherstellen (falls verfügbar)
cd spikeball
git checkout HEAD -- src/components/spikeball/PlayersTabUpdated.tsx

# Option 2: Manuelles Checken auf versteckte Zeichencd spikeball
head -3 src/components/spikeball/PlayersTabUpdated.tsx | cat -A

# Option 3: Datei komplett neu schreiben
rm src/components/spikeball/PlayersTabUpdated.tsx
# Dann den Code manuell kopieren einfügen
```

# SHELL OUTPUT / ERROR
```
▲ Next.js 14.2.35
- Environments: .env
Creating an optimized production build ...
Failed to compile.
./src/components/spikeball/PlayersTabUpdated.tsx
Error: 
x Unterminated string constant
,-[/home/server2/spikeball/src/components/spikeball/PlayersTabUpdated.tsx:1:1]
1 | 'use client';
  : ^^^^^^^^^^^^^^
x Unterminated string constant
,-[/home/server2/spikeball/src/components/spikeball/PlayersTabUpdated.tsx:507:1]
507 |   );
   }"
     ^
Caused by:
Syntax Error
```

# WEITERE RESOURCEN
- Datei: `spikeball/src/components/spikeball/PlayersTabUpdated.tsx`
- Führe auf dem Server aus: `cd spikeball && hexdump -C src/components/spikeball/PlayersTabUpdated.tsx | head -20` um versteckte Zeichen zu sehen

# TEMPORÄRER LÖSUNGSWEG
Falls erforderlich, kannst du die Option nutzen, die `page.tsx` wieder auf die alte `PlayersTab` umzustellen:
```typescript
// In src/app/page.tsx:
import PlayersTab from "@/components/spikeball/PlayersTab";
// Und im TabsContent:
<PlayersTab
  players={players}
  onPlayersChange={handlePlayersChange}
  isAdmin={user.isAdmin}
  currentUsername={user.username}
/>
```
Das wird die Instagram-Features deaktivieren aber die Seite wieder funktionstüchtig machen.
---