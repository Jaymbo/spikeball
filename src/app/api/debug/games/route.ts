import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const games = await db.game.findMany({
      include: {
        team1Player1: { select: { name: true, eloRating: true } },
        team1Player2: { select: { name: true, eloRating: true } },
        team2Player1: { select: { name: true, eloRating: true } },
        team2Player2: { select: { name: true, eloRating: true } },
      },
      orderBy: { playedAt: 'desc' },
      take: 20,
    });

    const players = await db.player.findMany({
      select: { name: true, eloRating: true, gamesPlayed: true, wins: true, losses: true },
      orderBy: { eloRating: 'desc' },
    });

    return NextResponse.json({
      gamesCount: games.length,
      playersCount: players.length,
      games,
      players,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}