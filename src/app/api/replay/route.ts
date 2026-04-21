import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { processGameElo, calculateGlobalRanks } from "@/lib/elo";

/**
 * POST /api/replay
 * Reset all player ratings to 1000 and replays all games chronologically
 * This recalculates ELO ratings from scratch based on game history
 */
export async function POST(request: NextRequest) {
  try {
    // Get all games sorted chronologically
    const games = await db.game.findMany({
      orderBy: { playedAt: "asc" },
      include: {
        team1Player1: true,
        team1Player2: true,
        team2Player1: true,
        team2Player2: true,
        eloChanges: true,
      },
    });

    if (games.length === 0) {
      return NextResponse.json({ message: "No games to replay" }, { status: 200 });
    }

    await db.$transaction(async (tx) => {
      // Step 1: Reset all players to initial state
      const updatedPlayers = await tx.player.updateMany({
        data: {
          eloRating: 1000,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          lastDecayAt: null,
        },
      });

      // Step 2: Delete all EloChange records
      await tx.eloChange.deleteMany({});

      // Step 3: Replay each game chronologically
      for (const game of games) {
        // Fetch current player ratings from DB (they've been reset)
        const currentPlayers = await tx.player.findMany({
          where: {
            id: {
              in: [
                game.team1Player1Id,
                game.team1Player2Id,
                game.team2Player1Id,
                game.team2Player2Id,
              ],
            },
          },
        });

        const p1 = currentPlayers.find((p) => p.id === game.team1Player1Id)!;
        const p2 = currentPlayers.find((p) => p.id === game.team1Player2Id)!;
        const p3 = currentPlayers.find((p) => p.id === game.team2Player1Id)!;
        const p4 = currentPlayers.find((p) => p.id === game.team2Player2Id)!;

        // Calculate global ranks for participation bonus
        const allPlayers = await tx.player.findMany({
          orderBy: { eloRating: 'desc' }
        });
        const totalPlayers = allPlayers.length;
        const ranks = calculateGlobalRanks(allPlayers);

        // Calculate ELO changes based on current ratings
        const eloResult = processGameElo(
          {
            team1Player1: { id: p1.id, eloRating: p1.eloRating, globalRank: ranks.get(p1.id) || 1 },
            team1Player2: { id: p2.id, eloRating: p2.eloRating, globalRank: ranks.get(p2.id) || 1 },
            team2Player1: { id: p3.id, eloRating: p3.eloRating, globalRank: ranks.get(p3.id) || 1 },
            team2Player2: { id: p4.id, eloRating: p4.eloRating, globalRank: ranks.get(p4.id) || 1 },
          },
          game.team1Score,
          game.team2Score,
          totalPlayers
        );

        const team1Won = game.team1Score > game.team2Score;

        // Update each player with new rating and stats
        await tx.player.update({
          where: { id: p1.id },
          data: {
            eloRating: eloResult.team1Player1.newRating,
            gamesPlayed: { increment: 1 },
            wins: { increment: team1Won ? 1 : 0 },
            losses: { increment: team1Won ? 0 : 1 },
            lastPlayedAt: game.playedAt,
          },
        });

        await tx.player.update({
          where: { id: p2.id },
          data: {
            eloRating: eloResult.team1Player2.newRating,
            gamesPlayed: { increment: 1 },
            wins: { increment: team1Won ? 1 : 0 },
            losses: { increment: team1Won ? 0 : 1 },
            lastPlayedAt: game.playedAt,
          },
        });

        await tx.player.update({
          where: { id: p3.id },
          data: {
            eloRating: eloResult.team2Player1.newRating,
            gamesPlayed: { increment: 1 },
            wins: { increment: team1Won ? 0 : 1 },
            losses: { increment: team1Won ? 1 : 0 },
            lastPlayedAt: game.playedAt,
          },
        });

        await tx.player.update({
          where: { id: p4.id },
          data: {
            eloRating: eloResult.team2Player2.newRating,
            gamesPlayed: { increment: 1 },
            wins: { increment: team1Won ? 0 : 1 },
            losses: { increment: team1Won ? 1 : 0 },
            lastPlayedAt: game.playedAt,
          },
        });

        // Create EloChange records for audit trail
        await tx.eloChange.create({
          data: {
            playerId: p1.id,
            gameId: game.id,
            previousRating: p1.eloRating,
            newRating: eloResult.team1Player1.newRating,
            change: eloResult.team1Player1.change,
          },
        });

        await tx.eloChange.create({
          data: {
            playerId: p2.id,
            gameId: game.id,
            previousRating: p2.eloRating,
            newRating: eloResult.team1Player2.newRating,
            change: eloResult.team1Player2.change,
          },
        });

        await tx.eloChange.create({
          data: {
            playerId: p3.id,
            gameId: game.id,
            previousRating: p3.eloRating,
            newRating: eloResult.team2Player1.newRating,
            change: eloResult.team2Player1.change,
          },
        });

        await tx.eloChange.create({
          data: {
            playerId: p4.id,
            gameId: game.id,
            previousRating: p4.eloRating,
            newRating: eloResult.team2Player2.newRating,
            change: eloResult.team2Player2.change,
          },
        });
      }
    });

    const updatedPlayers = await db.player.findMany({
      orderBy: { eloRating: "desc" },
    });

    return NextResponse.json(
      {
        message: `Successfully replayed ${games.length} games. Ratings reset and recalculated.`,
        gamesReplayed: games.length,
        players: updatedPlayers,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error replaying games:", error);
    return NextResponse.json(
      { error: "Failed to replay games" },
      { status: 500 },
    );
  }
}
