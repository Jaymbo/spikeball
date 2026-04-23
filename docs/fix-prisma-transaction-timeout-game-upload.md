---
title: Prisma Transaction Timeout - Game Upload Failed
tags: [prisma, transaction, timeout, nextjs, api]
---
# PROBLEM
Das Hochladen neuer Spiele über die API schlägt fehl mit einem Prisma `P2028` Timeout-Error ("Transaction already closed"). Die Transaktion läuft nach 5000ms ab, wird aber nicht abgeschlossen.

# LÖSUNG
Innerhalb einer Prisma-Transaktion müssen ALLE Datbankoperationen das `tx`-Objekt verwenden, nicht die globale `db`-Instanz. Die Hilfsfunktion `updatePlayerStats()` hat `db.player.update()` benutzt, läuft also außerhalb der Transaktion.

Schritte:
1. `updatePlayerStatsInTx()` aus `game-utils.ts` exportieren (von private zu public)
2. In `src/app/api/games/route.ts` die 4 `updatePlayerStats()` Aufrufe durch `updatePlayerStatsInTx()` ersetzen
3. Den `tx` Parameter durchreichen

# CODE / COMMANDS

In `src/lib/game-utils.ts` - Die Funktion exportieren:
```typescript
export async function updatePlayerStatsInTx(
  playerId: string,
  newRating: number,
  won: boolean,
  playedAt: Date,
  tx: Omit<typeof db, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
) {
  return tx.player.update({
    where: { id: playerId },
    data: {
      eloRating: newRating,
      gamesPlayed: { increment: 1 },
      wins: { increment: won ? 1 : 0 },
      losses: { increment: won ? 0 : 1 },
      lastPlayedAt: playedAt,
    },
  });
}
```

In `src/app/api/games/route.ts` - Die Funktion mit `tx` verwenden:
```typescript
const { updatePlayerStatsInTx } = await import("@/lib/game-utils");

await updatePlayerStatsInTx(p1.id, newRating, team1Won, gameDate, tx);
// ... für alle 4 Spieler
```

# SHELL OUTPUT / ERROR
```
prisma:error 
Invalid `prisma.eloChange.createMany()` invocation:
Transaction API error: Transaction already closed: A query cannot be executed on an expired transaction. The timeout for this transaction was 5000 ms, however 5069 ms passed since the start of the transaction.
```

# WEITERE RESOURCEN
- `src/app/api/games/route.ts` - POST Handler
- `src/lib/game-utils.ts` - Hilfsfunktionen
---