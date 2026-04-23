import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { INITIAL_RATING, processGameElo, calculateGlobalRanks } from "@/lib/elo";
import { updatePlayerStatsInTx, replayGame } from "@/lib/game-utils";

// GET /api/games - List games with player names
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: "Offset cannot be negative" },
        { status: 400 }
      );
    }

        const games = await db.game.findMany({
      orderBy: [{ playedAt: "desc" }, { createdAt: "desc" }],
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

    // Calculate global ranks for participation bonus
    const allPlayers = await db.player.findMany({
      orderBy: { eloRating: 'desc' }
    });
    const totalPlayers = allPlayers.length;
    const ranks = calculateGlobalRanks(allPlayers);

    // Calculate ELO changes with new system
    const eloResult = processGameElo(
      {
        team1Player1: { id: p1.id, eloRating: p1.eloRating, globalRank: ranks.get(p1.id) || 1 },
        team1Player2: { id: p2.id, eloRating: p2.eloRating, globalRank: ranks.get(p2.id) || 1 },
        team2Player1: { id: p3.id, eloRating: p3.eloRating, globalRank: ranks.get(p3.id) || 1 },
        team2Player2: { id: p4.id, eloRating: p4.eloRating, globalRank: ranks.get(p4.id) || 1 },
      },
      team1Score,
      team2Score,
      totalPlayers
    );

    const team1Won = team1Score > team2Score;
    const gameDate = playedAt ? new Date(playedAt) : new Date();

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
          playedAt: gameDate,
        },
        include: {
          team1Player1: true,
          team1Player2: true,
          team2Player1: true,
          team2Player2: true,
          eloChanges: true,
        },
      });

      // Update all 4 players using helper function
      await updatePlayerStatsInTx(
        p1.id,
        eloResult.team1Player1.newRating,
        team1Won,
        gameDate,
        tx
      );
      await updatePlayerStatsInTx(
        p2.id,
        eloResult.team1Player2.newRating,
        team1Won,
        gameDate,
        tx
      );
      await updatePlayerStatsInTx(
        p3.id,
        eloResult.team2Player1.newRating,
        !team1Won,
        gameDate,
        tx
      );
      await updatePlayerStatsInTx(
        p4.id,
        eloResult.team2Player2.newRating,
        !team1Won,
        gameDate,
        tx
      );

      // Create ELO change records
      await tx.eloChange.createMany({
        data: [
          {
            playerId: p1.id,
            gameId: newGame.id,
            previousRating: p1.eloRating,
            newRating: eloResult.team1Player1.newRating,
            change: eloResult.team1Player1.change,
          },
          {
            playerId: p2.id,
            gameId: newGame.id,
            previousRating: p2.eloRating,
            newRating: eloResult.team1Player2.newRating,
            change: eloResult.team1Player2.change,
          },
          {
            playerId: p3.id,
            gameId: newGame.id,
            previousRating: p3.eloRating,
            newRating: eloResult.team2Player1.newRating,
            change: eloResult.team2Player1.change,
          },
          {
            playerId: p4.id,
            gameId: newGame.id,
            previousRating: p4.eloRating,
            newRating: eloResult.team2Player2.newRating,
            change: eloResult.team2Player2.change,
          },
        ],
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

      for (const gameToReplay of remainingGames) {
        await replayGame(tx, gameToReplay);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting game:", error);
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}
