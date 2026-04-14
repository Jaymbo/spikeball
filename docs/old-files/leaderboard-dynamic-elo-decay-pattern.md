---
title: Leaderboard Dynamic ELO Decay Pattern
tags: [leaderboard, elo-deay, nextjs, performance, cron-jobs]
---

# PROBLEM
Das Leaderboard wendet ELO Decay auf jeden GET-Request an. Dies führt zu Performance-Problemen mit vielen Spielern und inkonsistentem Verhalten. Decay sollte regelmäßig (z.B. täglich) und nicht on-demand stattfinden.

# LÖSUNG
Es gibt zwei Ansätze:

### Ansatz 1: Cron Job für Decay (empfohlen für Production)
1. Erstelle einen separaten API-Endpoint `/api/decay` für Decay
2. Rufe diesen regelmäßig über cron job auf (z.B. täglich Mitternacht)
3. Führe Decay-Ausführung aus dem Leaderboard-Endpoint heraus

### Ansatz 2: In-Memory Caching mit Triggern
1. Cache das Leaderboard für eine gewisse Zeit
2. Trigger Decay nur bei bestimmten Events (z.B. Registrierung neuer Spiele)

### Aktuelle Implementierung:
- Wende Decay bei jedem Aufruf an (potentiell sehr viel DB-Load)
- Filtere 'root' Benutzer aus der Anzeige
- Dynamisches Rendering mit `force-dynamic`

# CODE / COMMANDS
```typescript
// Aktuelle Implementation (aus spikeball/src/app/api/leaderboard/route.ts)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // Decay wird bei JEDEM Aufruf angewendet (nicht empfohlen bei vielen Spielern)
  await applyEloDecay()
  
  const players = await db.player.findMany({
    orderBy: { eloRating: 'desc' }
  })
  
  // Root-Benutzer filtern
  const visiblePlayers = players.filter(p => p.name !== 'root')
  
  const leaderboard = visiblePlayers.map((player, index) => ({
    rank: index + 1,
    id: player.id,
    name: player.name,
    eloRating: player.eloRating,
    lastPlayedAt: player.lastPlayedAt,
    gamesPlayed: player.gamesPlayed,
    wins: player.wins,
    losses: player.losses,
    winRate: player.gamesPlayed > 0
      ? (player.wins / player.gamesPlayed) * 100
      : 0,
    createdAt: player.createdAt,
    profilePicture: player.profilePicture,
  }))
  
  return NextResponse.json(leaderboard, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}

async function applyEloDecay() {
  const players = await db.player.findMany({
    where: { lastPlayedAt: { not: null } }
  })
  
  for (const player of players) {
    const { newRating, monthsInactive } = calculateDecay(
      player.eloRating,
      player.lastPlayedAt,
      player.lastDecayAt
    )
    
    if (monthsInactive > 0 && newRating !== player.eloRating) {
      await db.player.update({
        where: { id: player.id },
        data: {
          eloRating: newRating,
          lastDecayAt: new Date()
        }
      })
    }
  }
}
```

### Empfohlene Cron-job Implementation:

```typescript
// spikeball/src/app/api/decay/route.ts (Bereits vorhanden)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateDecay } from '@/lib/elo'

export async function POST() {
  const players = await db.player.findMany({
    where: { lastPlayedAt: { not: null } }
  })
  
  const updates = []
  
  for (const player of players) {
    const { newRating, monthsInactive } = calculateDecay(
      player.eloRating,
      player.lastPlayedAt,
      player.lastDecayAt
    )
    
    if (monthsInactive > 0 && newRating !== player.eloRating) {
      updates.push(
        db.player.update({
          where: { id: player.id },
          data: {
            eloRating: newRating,
            lastDecayAt: new Date()
          }
        })
      )
    }
  }
  
  await Promise.all(updates)
  
  return NextResponse.json(
    { success: true, updatedPlayers: updates.length },
    { status: 200 }
  )
}
```

### Cron-Setup (Linux/systemd):

```bash
# /etc/systemd/system/spikeball-decay.service
[Unit]
Description=Spikeball ELO Decay Job

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -X POST http://localhost:3000/api/decay
User=www-data
WorkingDirectory=/home/server2/spikeball

[Install]
WantedBy=multi-user.target
```

```bash
# /etc/systemd/system/spikeball-decay.timer
[Unit]
Description=Run Spikeball ELO Decay daily at midnight

[Timer]
OnCalendar=*-*-* 00:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
# Timer aktivieren
sudo systemctl enable spikeball-decay.timer
sudo systemctl start spikeball-decay.timer
```

# SHELL OUTPUT / ERROR
```
N/A - Aber bei vielen Spielern könnte dies zu langsamen Responsezeiten und hoher DB-Last führen.
```

# WEITERE RESOURCEN
- Dateipfade:
  - `spikeball/src/app/api/leaderboard/route.ts`
  - `spikeball/src/app/api/decay/route.ts`
- Next.js Dynamic Rendering: <https://nextjs.org/docs/app/building-your-application/rendering/server-components/static-rendering>
- Systemd Timer Units: <https://www.freedesktop.org/software/systemd/man/systemd.timer.html>
---