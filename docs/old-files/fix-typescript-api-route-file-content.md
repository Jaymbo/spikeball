---
title: TypeScript API Route File Corrupted
tags: [typescript, nextjs, api, route]
---
# PROBLEM
Die Datei `src/app/api/leaderboard/route.ts` enthielt keine validen TypeScript-Code, sondern stattdessen englischen Beschreibungstext ("User wants to modify an existing Next.js API route file..."). Dies führte zu über 100 TypeScript-Fehlern des Typs "Unexpected keyword or identifier" und "Cannot find name".

# LÖSUNG
1. Die korrupte Datei war komplett mit Text statt Code gefüllt.
2. Die Datei musste mit dem richtigen TypeScript-Code für eine Next.js API Route überschrieben werden.
3. Der ursprüngliche Code konnte aus der Analyse-Information rekonstruiert werden.

# CODE / COMMANDS
```typescript spikeball/src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateDecay } from '@/lib/elo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  await applyEloDecay();
  
  const players = await db.player.findMany();
  
  const visiblePlayers = players.filter(p => p.name !== 'root');
  
  const leaderboard = visiblePlayers.map(player => ({
    id: player.id,
    name: player.name,
    eloRating: player.eloRating,
    lastPlayedAt: player.lastPlayedAt,
    gamesPlayed: player.gamesPlayed,
  }));
  
  return NextResponse.json(leaderboard, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

async function applyEloDecay() {
  const players = await db.player.findMany({
    where: {
      lastPlayedAt: { not: null }
    }
  });
  
  for (const player of players) {
    const { newRating, monthsInactive } = calculateDecay(
      player.eloRating,
      player.lastPlayedAt,
      player.lastDecayAt
    );
    
    if (monthsInactive > 0 && newRating !== player.eloRating) {
      await db.player.update({
        where: { id: player.id },
        data: { 
          eloRating: newRating,
          lastDecayAt: new Date()
        }
      });
    }
  }
}
```

# SHELL OUTPUT / ERROR
```
TS1434: Unexpected keyword or identifier.
TS2304: Cannot find name 'User'.
TS2304: Cannot find name 'wants'.
TS2304: Cannot find name 'to'.
...
(über 100 ähnliche Fehler für jedes Wort im englischen Text)
```

# WEITERE RESOURCEN
- Datei: `spikeball/src/app/api/leaderboard/route.ts`
- Helper functions: `spikeball/src/lib/elo.ts`
- Database: `spikeball/src/lib/db.ts`
---