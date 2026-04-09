import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/players/[id]/games - Get player's game history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth-Prüfung - Nur eingeloggte User dürfen Spiel-Historie sehen
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const playerId = params.id;
    
    // Validation
    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
    }

    const player = await db.player.findUnique({
      where: { id: playerId },
      include: {
        gamesTeam1P1: {
          orderBy: { playedAt: "desc" },
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
        },
        gamesTeam1P2: {
          orderBy: { playedAt: "desc" },
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
        },
        gamesTeam2P1: {
          orderBy: { playedAt: "desc" },
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
        },
        gamesTeam2P2: {
          orderBy: { playedAt: "desc" },
          include: {
            team1Player1: true,
            team1Player2: true,
            team2Player1: true,
            team2Player2: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Combine all games and sort by playedAt (newest first)
    const allGames = [
      ...player.gamesTeam1P1,
      ...player.gamesTeam1P2,
      ...player.gamesTeam2P1,
      ...player.gamesTeam2P2,
    ].sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

    // Remove duplicates (a game can appear multiple times if player was in a team with multiple relations)
    const uniqueGames = allGames.filter(
      (game, index, self) => index === self.findIndex((g) => g.id === game.id)
    );

    return NextResponse.json({
      games: uniqueGames.map((game) => ({
        id: game.id,
        team1Player1: {
          name: game.team1Player1.name,
          eloRating: Number(game.team1Player1.eloRating),
        },
        team1Player2: {
          name: game.team1Player2.name,
          eloRating: Number(game.team1Player2.eloRating),
        },
        team2Player1: {
          name: game.team2Player1.name,
          eloRating: Number(game.team2Player1.eloRating),
        },
        team2Player2: {
          name: game.team2Player2.name,
          eloRating: Number(game.team2Player2.eloRating),
        },
        team1Score: game.team1Score,
        team2Score: game.team2Score,
        playedAt: game.playedAt.toISOString(),
        createdAt: game.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching player games:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}