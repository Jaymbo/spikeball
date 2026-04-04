import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - Liefert alle ausstehenden Anfragen für den aktuellen User
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const requests = await db.friendship.findMany({
      where: {
        receiverId: currentUser.userId,
        status: "pending",
      },
      include: {
        requester: {
          include: { player: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      requests.map((r) => ({
        id: r.id,
        username: r.requester.username,
        playerName: r.requester.player?.name || null,
        playerId: r.requester.player?.id || null,
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Anfragen" }, { status: 500 });
  }
}