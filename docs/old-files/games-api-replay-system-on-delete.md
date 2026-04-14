---
title: Games API Replay System on Delete
tags: [nextjs, api-routes, transaction, replay, elo-recovery]
---

# PROBLEM
Wenn ein Spiel gelöscht wird, müssen alle nachfolgenden Spieler-ELO-Ratings korrigiert werden. Einfaches "Undo" reicht nicht, da später gespielte Spiele sich auf den neuen ELO-Stand auswirken müssen.

# LÖSUNG
Implementiere ein Replay-System beim Löschen eines Spiels:
1. Alle Statistiken/Ratings auf INITIAL_RATING (1000) zurücksetzen
2. Alle verbleibenden Spiele chronologisch durchlaufen und neu simulieren
3. ELO-Änderungen mit korrekten Werten protokollieren
Alles in einer Transactions, um Konsistenz zu gewährleisten.

# CODE / COMMANDS
```typescript
// DELETE /api/games?id=xxx - Delete a game and revert ELO changes
export async function DELETE(request: NextRequest) {
  try {
    // 1. Authorization: Only Admin
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin required to delete games" },
        { status: 403 }
      );
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    // 2. Get game to delete with elo changes
    const game = await db.game.findUnique({
      where: { id },
      include: { eloChanges: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // 3. Execute atomic Transaction
    await db.$transaction(async (tx) => {
      // 3a) Delete selected game and its elo-change records
      await tx.eloChange.deleteMany({ where: { gameId: id } });
      await tx.game.delete({ where: { id } });

      // 3b) RESET ALL players to INITIAL state
      await tx.player.updateMany({
        data: {
          eloRating: INITIAL_RATING, // 1000
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          lastPlayedAt: null,
          lastDecayAt: null,
        },
      });

      // 3c) REPLAY all remaining games chronologically (by playedAt, then createdAt)
      const remainingGames = await tx.game.findMany({
        orderBy: [
          { playedAt: "asc" },
          { createdAt: "asc" },
        ],
      });

      for (const replayGame of remainingGames) {
        // Get current player ratings for this replay step
        const currentPlayers = await tx.player.findMany({
          where: {
            id: {
              in: [
                replayGame.team1Player1Id,
                replayGame.team1Player2Id,
                replayGame.team2Player1Id,
                replayGame.team2Player2Id,
              ],
            },
          },
        });

        const p1 = currentPlayers.find(p => p.id === replayGame.team1Player1Id)!
        const p2 = currentPlayers.find(p => p.id === replayGame.team1Player2Id)!
        const p3 = currentPlayers.find(p => p.id === replayGame.team2Player1Id)!
        const p4 = currentPlayers.find(p => p.id === replayGame.team2Player2Id)!

        // Validate all players exist
        if (!p1 || !p2 || !p3 || !p4) {
          throw new Error("Replay failed: one or more players not found");
        }

        // Re-calculate ELO for this game using current ratings
        const eloResult = processGameElo(
          {
            team1Player1: { id: p1.id, eloRating: p1.eloRating },
            team1Player2: { id: p2.id, eloRating: p2.eloRating },
            team2Player1: { id: p3.id, eloRating: p3.eloRating },
            team2Player2: { id: p4.id, eloRating: p4.eloRating },
          },
          replayGame.team1Score,
          replayGame.team2Score,
        );

        // Determine winner
        const team1Won = replayGame.team1Score > replayGame.team2Score;

        // Update all 4 players with new ratings and stats
        // Player 1
        await tx.player.update({
          where: { id: p1.id },
          data: {
            eloRating: eloResult.team1Player1.newRating,
            gamesPlayed: { increment: 1 },
            wins: { increment: team1Won ? 1 : 0 },
            losses: { increment: team1Won ? 0 : 1 },
            lastPlayedAt: replayGame.playedAt,
          },
        });

        // Player 2 (same pattern)
        // Player 3, 4 (same pattern with reversed wins/losses)
        // ...

        // Create replay ELO change records (using createMany for efficiency)
        await tx.eloChange.createMany({
          data: [
            {
              playerId: p1.id,
              gameId: replayGame.id,
              previousRating: p1.eloRating,
              newRating: eloResult.team1Player1.newRating,
              change: eloResult.team1Player1.change,
            },
            // ... similar for p2, p3, p4
          ],
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}
```

# SHELL OUTPUT / ERROR
```
PrismaClientUnknownRequestError: Transaction failed
Error: Replay failed: one or more players not found
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/app/api/games/route.ts`
- Prisma Transactions: <https://www.prisma.io/docs/orm/prisma-client/queries/transactions>
- ELO Re-calculation: <https://github.com/David-Tkach/elo-rating>
---