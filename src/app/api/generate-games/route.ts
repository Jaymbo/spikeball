import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { generateBalancedMatchups } from "@/lib/elo";

// POST /api/generate-games - Generate balanced matchups for selected players
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerIds } = body;

    if (!Array.isArray(playerIds) || playerIds.length < 4) {
      return NextResponse.json(
        { error: "At least 4 players are required" },
        { status: 400 },
      );
    }

    if (playerIds.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 players supported" },
        { status: 400 },
      );
    }

    // Check for duplicates
    if (new Set(playerIds).size !== playerIds.length) {
      return NextResponse.json(
        { error: "Duplicate players not allowed" },
        { status: 400 },
      );
    }

    // Fetch players
    const players = await db.player.findMany({
      where: { id: { in: playerIds } },
    });

    if (players.length !== playerIds.length) {
      return NextResponse.json(
        { error: "One or more players not found" },
        { status: 404 },
      );
    }

    // Build rating map
    const ratingMap = new Map<string, number>();
    for (const player of players) {
      ratingMap.set(player.id, player.eloRating);
    }

    // Generate balanced matchups
    const matchups = generateBalancedMatchups(playerIds, ratingMap);

    // Enrich matchups with player names
    const enrichedMatchups = matchups.map((matchup) => ({
      team1: {
        player1: {
          id: matchup.team1[0],
          name: players.find((p) => p.id === matchup.team1[0])!.name,
          eloRating: ratingMap.get(matchup.team1[0])!,
        },
        player2: {
          id: matchup.team1[1],
          name: players.find((p) => p.id === matchup.team1[1])!.name,
          eloRating: ratingMap.get(matchup.team1[1])!,
        },
      },
      team2: {
        player1: {
          id: matchup.team2[0],
          name: players.find((p) => p.id === matchup.team2[0])!.name,
          eloRating: ratingMap.get(matchup.team2[0])!,
        },
        player2: {
          id: matchup.team2[1],
          name: players.find((p) => p.id === matchup.team2[1])!.name,
          eloRating: ratingMap.get(matchup.team2[1])!,
        },
      },
      balanceScore: matchup.balanceScore,
      team1Avg: Math.round(matchup.team1Avg),
      team2Avg: Math.round(matchup.team2Avg),
    }));

    return NextResponse.json({
      matchups: enrichedMatchups,
      availablePlayers: players.length,
    });
  } catch (error) {
    console.error("Error generating games:", error);
    return NextResponse.json(
      { error: "Failed to generate games" },
      { status: 500 },
    );
  }
}
