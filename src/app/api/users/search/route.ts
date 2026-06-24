import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const users = await db.user.findMany({
      where: {
        username: {
          contains: query
        }
      },
      take: 10,
      select: {
        id: true,
        username: true,
        createdAt: true,
        player: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Hole existierende Freundschaften zwischen currentUser und gefundenen Benutzern
    const userIds = users.map(u => u.id);
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          {
            requesterId: currentUser.userId,
            receiverId: { in: userIds }
          },
          {
            receiverId: currentUser.userId,
            requesterId: { in: userIds }
          }
        ]
      }
    });

    // Map friendships zu user IDs für schnellen Lookup
    const friendshipMap = new Map<string, string>();
    friendships.forEach(f => {
      const targetUserId = f.requesterId === currentUser.userId ? f.receiverId : f.requesterId;
      friendshipMap.set(targetUserId, f.status);
    });

    const results = users.map((user) => ({
      id: user.id,
      username: user.username,
      playerName: user.player?.name || null,
      playerId: user.player?.id || null,
      friendshipStatus: friendshipMap.get(user.id) || null
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Fehler bei der Suche" }, { status: 500 });
  }
}
