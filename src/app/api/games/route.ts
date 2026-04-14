import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { INITIAL_RATING, processGameElo } from "@/lib/elo";

// GET /api/games - List games with player names
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const games = await db.game.findMany({
      orderBy: { playedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        team1Player1: { select: { id: true, name: true, eloRating: true, profilePicture: true } },
        team1Player2: { select: { id: true, name: true, eloRating: true, profilePicture: true } },
        team2Player1: { select: { id: true, name: true, eloRating: true, profilePicture: true } },
        team2Player2: { select: { id: true, name: true, eloRating: true, profilePicture: true } },
        eloChanges: true,
      },
    });

    const total = await db.game.count();

    return NextResponse.json({ games, total });
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}

// POST /api/games - Record a game and calculate ELO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      team1Player1Id,
      team1Player2Id,
      team2Player1Id,
      team2Player2Id,
      team1Score,
      team2Score,
      playedAt,
    } = body;

    // Validate input
    const allPlayerIds = [team1Player1Id, team1Player2Id, team2Player1Id, team2Player2Id];
    if (allPlayerIds.some((id) => !id)) {
      return NextResponse.json({ error: "All 4 player IDs are required" }, { status: 400 });
    }

    // Check for duplicate players in the same game
    const uniqueIds = new Set(allPlayerIds);
    if (uniqueIds.size !== 4) {
      return NextResponse.json(
        { error: "All 4 players must be different" },
        { status: 400 },
      );
    }

    if (typeof team1Score !== "number" || typeof team2Score !== "number") {
      return NextResponse.json({ error: "Scores must be numbers" }, { status: 400 });
    }

    if (team1Score < 0 || team2Score < 0) {
      return NextResponse.json({ error: "Scores cannot be negative" }, { status: 400 });
    }

    if (team1Score === team2Score) {
      return NextResponse.json(
        { error: "Spikeball games cannot end in a tie" },
        { status: 400 },
      );
    }

    // Fetch all 4 players
    const players = await db.player.findMany({
      where: { id: { in: allPlayerIds } },
    });

    if (players.length !== 4) {
      return NextResponse.json(
        { error: "One or more players not found" },
        { status: 404 },
      );
    }

    const p1 = players.find((p) => p.id === team1Player1Id)!;
    const p2 = players.find((p) => p.id === team1Player2Id)!;
    const p3 = players.find((p) => p.id === team2Player1Id)!;
    const p4 = players.find((p) => p.id === team2Player2Id)!;

    // Calculate ELO changes
    const eloResult = processGameElo(
      {
        team1Player1: { id: p1.id, eloRating: p1.eloRating },
        team1Player2: { id: p2.id, eloRating: p2.eloRating },
        team2Player1: { id: p3.id, eloRating: p3.eloRating },
        team2Player2: { id: p4.id, eloRating: p4.eloRating },
      },
      team1Score,
      team2Score,
    );

    const team1Won = team1Score > team2Score;

    // Create game and update player ratings in a transaction
    const game = await db.$transaction(async (tx) => {
      // Create the game
      const newGame = await tx.game.create({
        data: {
          team1Player1Id,
          team1Player2Id,
          team2Player1Id,
          team2Player2Id,
          team1Score,
          team2Score,
          playedAt: playedAt ? new Date(playedAt) : new Date(),
        },
        include: {
          team1Player1: true,
          team1Player2: true,
          team2Player1: true,
          team2Player2: true,
          eloChanges: true,
        },
      });

      // Update player 1 (Team 1 Player 1)
      await tx.player.update({
        where: { id: p1.id },
        data: {
          eloRating: eloResult.team1Player1.newRating,
          gamesPlayed: { increment: 1 },
          wins: { increment: team1Won ? 1 : 0 },
          losses: { increment: team1Won ? 0 : 1 },
          lastPlayedAt: playedAt ? new Date(playedAt) : new Date(),
        },
      });

      // Update player 2 (Team 1 Player 2)
      await tx.player.update({
        where: { id: p2.id },
        data: {
          eloRating: eloResult.team1Player2.newRating,
          gamesPlayed: { increment: 1 },
          wins: { increment: team1Won ? 1 : 0 },
          losses: { increment: team1Won ? 0 : 1 },
          lastPlayedAt: playedAt ? new Date(playedAt) : new Date(),
        },
      });

      // Update player 3 (Team 2 Player 1)
      await tx.player.update({
        where: { id: p3.id },
        data: {
          eloRating: eloResult.team2Player1.newRating,
          gamesPlayed: { increment: 1 },
          wins: { increment: team1Won ? 0 : 1 },
          losses: { increment: team1Won ? 1 : 0 },
          lastPlayedAt: playedAt ? new Date(playedAt) : new Date(),
        },
      });

      // Update player 4 (Team 2 Player 2)
      await tx.player.update({
        where: { id: p4.id },
        data: {
          eloRating: eloResult.team2Player2.newRating,
          gamesPlayed: { increment: 1 },
          wins: { increment: team1Won ? 0 : 1 },
          losses: { increment: team1Won ? 1 : 0 },
          lastPlayedAt: playedAt ? new Date(playedAt) : new Date(),
        },
      });

      // Create ELO change records
      await tx.eloChange.create({
        data: {
          playerId: p1.id,
          gameId: newGame.id,
          previousRating: p1.eloRating,
          newRating: eloResult.team1Player1.newRating,
          change: eloResult.team1Player1.change,
        },
      });

      await tx.eloChange.create({
        data: {
          playerId: p2.id,
          gameId: newGame.id,
          previousRating: p2.eloRating,
          newRating: eloResult.team1Player2.newRating,
          change: eloResult.team1Player2.change,
        },
      });

      await tx.eloChange.create({
        data: {
          playerId: p3.id,
          gameId: newGame.id,
          previousRating: p3.eloRating,
          newRating: eloResult.team2Player1.newRating,
          change: eloResult.team2Player1.change,
        },
      });

      await tx.eloChange.create({
        data: {
          playerId: p4.id,
          gameId: newGame.id,
          previousRating: p4.eloRating,
          newRating: eloResult.team2Player2.newRating,
          change: eloResult.team2Player2.change,
        },
      });

      return newGame;
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Error recording game:", error);
    return NextResponse.json({ error: "Failed to record game" }, { status: 500 });
  }
}

// DELETE /api/games?id=xxx - Delete a game and revert ELO changes
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin required to delete games" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    // Get the game with elo changes
    const game = await db.game.findUnique({
      where: { id },
      include: { eloChanges: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      // 1) Delete selected game and its elo-change rows
      await tx.eloChange.deleteMany({ where: { gameId: id } });
      await tx.game.delete({ where: { id } });

      // 2) Reset all player stats/ratings
      await tx.player.updateMany({
        data: {
          eloRating: INITIAL_RATING,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          lastPlayedAt: null,
          lastDecayAt: null,
        },
      });

      // 3) Replay all remaining games chronologically
      const remainingGames = await tx.game.findMany({
        orderBy: [{ playedAt: "asc" }, { createdAt: "asc" }],
      });

      for (const replayGame of remainingGames) {
        const playerIds = [
          replayGame.team1Player1Id,
          replayGame.team1Player2Id,
          replayGame.team2Player1Id,
          replayGame.team2Player2Id,
        ];

        const currentPlayers = await tx.player.findMany({
          where: { id: { in: playerIds } },
        });

        const p1 = currentPlayers.find((p) => p.id === replayGame.team1Player1Id);
        const p2 = currentPlayers.find((p) => p.id === replayGame.team1Player2Id);
        const p3 = currentPlayers.find((p) => p.id === replayGame.team2Player1Id);
        const p4 = currentPlayers.find((p) => p.id === replayGame.team2Player2Id);

        if (!p1 || !p2 || !p3 || !p4) {
          throw new Error("Replay failed: one or more players not found");
        }

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

        const team1Won = replayGame.team1Score > replayGame.team2Score;

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

        await tx.player.update({
          where: { id: p2.id },
          data: {
            eloRating: eloResult.team1Player2.newRating,
            gamesPlayed: { increment: 1 },
            wins: { increment: team1Won ? 1 : 0 },
            losses: { increment: team1Won ? 0 : 1 },
            lastPlayedAt: replayGame.playedAt,
          },
        });

        await tx.player.update({
          where: { id: p3.id },
          data: {
            eloRating: eloResult.team2Player1.newRating,
            gamesPlayed: { increment: 1 },
            wins: { increment: team1Won ? 0 : 1 },
            losses: { increment: team1Won ? 1 : 0 },
            lastPlayedAt: replayGame.playedAt,
          },
        });

        await tx.player.update({
          where: { id: p4.id },
          data: {
            eloRating: eloResult.team2Player2.newRating,
            gamesPlayed: { increment: 1 },
            wins: { increment: team1Won ? 0 : 1 },
            losses: { increment: team1Won ? 1 : 0 },
            lastPlayedAt: replayGame.playedAt,
          },
        });

        await tx.eloChange.createMany({
          data: [
            {
              playerId: p1.id,
              gameId: replayGame.id,
              previousRating: p1.eloRating,
              newRating: eloResult.team1Player1.newRating,
              change: eloResult.team1Player1.change,
            },
            {
              playerId: p2.id,
              gameId: replayGame.id,
              previousRating: p2.eloRating,
              newRating: eloResult.team1Player2.newRating,
              change: eloResult.team1Player2.change,
            },
            {
              playerId: p3.id,
              gameId: replayGame.id,
              previousRating: p3.eloRating,
              newRating: eloResult.team2Player1.newRating,
              change: eloResult.team2Player1.change,
            },
            {
              playerId: p4.id,
              gameId: replayGame.id,
              previousRating: p4.eloRating,
              newRating: eloResult.team2Player2.newRating,
              change: eloResult.team2Player2.change,
            },
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
