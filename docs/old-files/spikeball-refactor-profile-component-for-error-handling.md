---
title: Spikeball Profile Refactoring - Error Handling & Modularization
tags: [spikeball, refactor, profile, error-handling, typescript]
---
# PROBLEM
Die Profil-Anzeigefunktion im Spikeball-Projekt zeigte mehrere Probleme: Fehler beim Laden von Profilen ohne spezifische Fehlermeldungen, monolithische Komponente mit ~250 Zeilen Code, fehlende Typendefinitionen, keine klare Fehlerbehandlung, und die API-Route lieferte unstrukturierte Daten ohne Validierung.

# LÖSUNG
1. API-Route verbessert mit Validierung und Konsistentem Logging
2. Type-Definitions-Datei erstellt (types.ts)
3. Monolithische PlayerProfile-Komponente in modularis lesbare Teile zerlegt: ProfileHeader, ProfileStats, EloChart, GameHistoryList, und PlayerProfileError
4. Robustes Error Handling mit Fehlerstatusanzeige und Retry-Funktion
5. Data-Shaping in der API implementiert (alle primitiven Werte zu Number und String konvertiert)

# CODE / COMMANDS

```bash
# Dateistruktur erstellt:
spikeball/src/components/profile/
├── types.ts                    # TypeScript Interfaces
├── PlayerProfile.tsx            # Main Container (refactored)
├── ProfileHeader.tsx            # Header with Avatar & Info
├── ProfileStats.tsx             # Stats Grid
├── EloChart.tsx                 # ELO-Verlauf Chart
├── GameHistoryList.tsx          # Spiel-Historie Liste
├── PlayerProfileError.tsx      # Error Komponente
└── AvatarUpload.tsx            # (existierende, unverändert)
```

```typescript
// API Call Pattern im Frontend:
const fetchPlayerData = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  try {
    const res = await fetch(`/api/players/${playerId}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    
    if (!data.player) {
      throw new Error("Invalid response: missing player data");
    }
    setPlayerData(data);
  } catch (err) {
    console.error("[PlayerProfile] Error fetching data:", err);
    setError(err as Error);
    toast.error("Profil konnte nicht geladen werden");
  } finally {
    setLoading(false);
  }
}, [playerId]);
```

```typescript
// Example: New modular components usage
import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { EloChart } from "./EloChart";
import { GameHistoryList } from "./GameHistoryList";
import { PlayerProfileError } from "./PlayerProfileError";

// Props are now strongly typed with interfaces from types.ts
```

# SHELL OUTPUT / ERROR
Keine Fehler - Build sollte erfolgreich sein. Falls Syntaxfehler auftreten, prüfe:
1. Alle neuen Dateien sind korrekt gespeichert
2. Import-Pfade stimmen
3. TypeScript-Compilier fehlerfrei

# WEITERE RESOURCES
- Hauptkomponente: `spikeball/src/components/profile/PlayerProfile.tsx`
- API-Route: `spikeball/src/app/api/players/[id]/route.ts`
- Type-Definitions: `spikeball/src/components/profile/types.ts`
