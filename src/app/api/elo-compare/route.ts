import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Auth-Prüfung - Nur eingeloggte User dürfen ELO-Verläufe vergleichen
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const { playerIds } = body;

    // Validierung
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json({ error: "playerIds ist erforderlich" }, { status: 400 });
    }

    if (playerIds.length > 8) {
      return NextResponse.json({ error: "Maximal 8 Spieler können verglichen werden" }, { status: 400 });
    }

    // Hole ELO-Historie für alle Spieler
    const players = await Promise.all(
      playerIds.map(async (playerId: string) => {
        const player = await db.player.findUnique({
          where: { id: playerId },
          include: {
            eloChanges: {
              orderBy: { createdAt: "desc" },
              take: 200, // Mehr Daten für Vergleich
            },
          },
        });

        if (!player) {
          return null;
        }

        return {
          playerId: player.id,
          playerName: player.name,
          eloHistory: player.eloChanges.map((change) => ({
            id: change.id,
            previousRating: Number(change.previousRating),
            newRating: Number(change.newRating),
            change: Number(change.change),
            createdAt: change.createdAt.toISOString(),
            game: change.game ? {
              id: change.game.id,
              team1Score: change.game.team1Score,
              team2Score: change.game.team2Score,
              playedAt: change.game.playedAt.toISOString(),
            } : null,
          })),
        };
      })
    );

    // Filter out null values (players not found)
    const validPlayers = players.filter((p) => p !== null);

    return NextResponse.json({
      players: validPlayers,
    });
  } catch (error) {
    console.error("[EloCompareAPI] Error fetching ELO comparison data:", error);
    return NextResponse.json(
      { error: "Failed to fetch ELO comparison data" },
      { status: 500 }
    );
  }
}