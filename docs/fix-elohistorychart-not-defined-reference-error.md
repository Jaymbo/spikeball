---
title: EloHistoryChart ReferenceError Not Defined
tags: [react, nextjs, typescript, import, component]
---
# PROBLEM
`PlayerProfile.tsx` verwendet `<EloHistoryChart>` auf Zeile 701, aber der Import fehlt. Dies führt zu einem `ReferenceError: EloHistoryChart is not defined` zur Laufzeit und die Komponente kann nicht gerendert werden.

# LÖSUNG
1. Prüfen, ob die Komponente existiert: `src/components/profile/EloHistoryChart.tsx` → Ja, Export `export function EloHistoryChart`
2. Den fehlenden Import in `PlayerProfile.tsx` hinzufügen
3. Import-Zeile einfügen: `import { EloHistoryChart } from "./EloHistoryChart";`

# CODE / COMMANDS
```typescript
// Fehlender Import in src/components/profile/PlayerProfile.tsx:
import { EloHistoryChart } from "./EloHistoryChart";

// Vorhandene Import-Zeile, nach der eingefügt wurde:
import { EloComparisonChart } from "./EloComparisonChart";
```

# SHELL OUTPUT / ERROR
```
ReferenceError: EloHistoryChart is not defined
Source
src/components/profile/PlayerProfile.tsx (701:16) @ EloHistoryChart
699 |             </CardHeader>
700 |             <CardContent>
> 701 |               <EloHistoryChart
    |                ^
702 |                 eloHistory={eloHistory}
703 |                 playerName={player.name}
704 |                 color="#f97316"
```

# WEITERE RESOURCEN
- Komponente: `src/components/profile/EloHistoryChart.tsx`
- Datei mit dem Fehler: `src/components/profile/PlayerProfile.tsx`
- Verwandte Komponente: `src/components/profile/EloComparisonChart.tsx` (diese war korrekt importiert)