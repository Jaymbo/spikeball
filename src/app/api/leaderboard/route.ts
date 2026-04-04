import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateDecay } from "@/lib/elo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/leaderboard - Get ranked leaderboard with decay applied on-the-fly
export async function GET() {
  try {
    // Apply ELO decay before returning leaderboard
    await applyEloDecay();

    const players = await db.player.findMany({
      orderBy: { eloRating: "desc" },
      include: {
        _count: {
          select: { eloChanges: true },
        },
      },
    });

    const visiblePlayers = players.filter(
      (player) => player.name.toLowerCase() !== "root"
    );

    const leaderboard = visiblePlayers.map((player, index) => ({
      rank: index + 1,
      id: player.id,
      name: player.name,
      eloRating: Math.round(player.eloRating),
      gamesPlayed: player.gamesPlayed,
      wins: player.wins,
      losses: player.losses,
      winRate:
        player.gamesPlayed > 0
          ? Math.round((player.wins / player.gamesPlayed) * 100)
          : 0,
      lastPlayedAt: player.lastPlayedAt,
      createdAt: player.createdAt,
    }));

    return NextResponse.json(leaderboard, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}

async function applyEloDecay() {
  const players = await db.player.findMany({
    where: {
      lastPlayedAt: { not: null },
    },
  });

  for (const player of players) {
    if (!player.lastPlayedAt) continue;

    const { newRating, monthsInactive } = calculateDecay(
      player.eloRating,
      player.lastPlayedAt,
      player.lastDecayAt,
    );

    if (monthsInactive > 0 && newRating < player.eloRating) {
      await db.player.update({
        where: { id: player.id },
        data: {
          eloRating: newRating,
          lastDecayAt: new Date(),
        },
      });
    }
  }
}
