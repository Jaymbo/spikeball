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
          contains: query,
          mode: "insensitive"
        }
      },
      include: { player: true },
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

    const results = users.map((user) => ({
      id: user.id,
      username: user.username,
      playerName: user.player?.name || null,
      playerId: user.player?.id || null
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Fehler bei der Suche" }, { status: 500 });
  }
}