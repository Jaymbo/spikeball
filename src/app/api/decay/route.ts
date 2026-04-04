import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateDecay } from "@/lib/elo";

// POST /api/decay - Manually trigger ELO decay for all inactive players
export async function POST() {
  try {
    const players = await db.player.findMany({
      where: {
        lastPlayedAt: { not: null },
      },
    });

    const decayResults: Array<{
      playerId: string;
      playerName: string;
      previousRating: number;
      newRating: number;
      monthsInactive: number;
    }> = [];

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

        decayResults.push({
          playerId: player.id,
          playerName: player.name,
          previousRating: Math.round(player.eloRating),
          newRating: Math.round(newRating),
          monthsInactive,
        });
      }
    }

    return NextResponse.json({
      decayed: decayResults.length,
      results: decayResults,
    });
  } catch (error) {
    console.error("Error applying decay:", error);
    return NextResponse.json(
      { error: "Failed to apply decay" },
      { status: 500 },
    );
  }
}
