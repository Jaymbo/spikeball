import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Find the player associated with this user (if any)
    const player = await db.player.findFirst({
      where: {
        userId: user.userId
      }
    });

    if (!player) {
      return NextResponse.json(
        { currentPlayerId: null, hasPlayer: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      currentPlayerId: player.id,
      hasPlayer: true,
      player: {
        id: player.id,
        name: player.name,
        profilePicture: player.profilePicture,
      }
    });
  } catch (error) {
    console.error("Error fetching current player:", error);
    return NextResponse.json(
      { error: "Failed to fetch current player" },
      { status: 500 }
    );
  }
}