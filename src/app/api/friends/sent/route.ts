import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - Liefert alle gesendeten Anfragen des aktuellen Users
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const requests = await db.friendship.findMany({
      where: {
        requesterId: currentUser.userId,
        status: "pending",
      },
      include: {
        receiver: {
          include: { player: { select: { id: true, name: true, profilePicture: true } } },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      requests.map((r) => ({
        id: r.id,
        username: r.receiver.username,
        playerName: r.receiver.player?.name || null,
        playerId: r.receiver.player?.id || null,
        profilePicture: r.receiver.player?.profilePicture || undefined,
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching sent friend requests:", error);
    return NextResponse.json({ error: "Fehler beim Laden der gesendeten Anfragen" }, { status: 500 });
  }
}