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
        username: r.requester.username,
        playerName: r.requester.player?.name || null,
        playerId: r.requester.player?.id || null,
        profilePicture: r.requester.player?.profilePicture || undefined,
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Anfragen" }, { status: 500 });
  }
}

// POST - Accept or reject friend requests
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const { friendshipId, action } = await request.json();

    if (!friendshipId || !action || (action !== "accept" && action !== "reject")) {
      return NextResponse.json({ error: "Ungültige Parameter" }, { status: 400 });
    }

    // Find the friendship and verify the current user is the receiver
    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return NextResponse.json({ error: "Freundschaft nicht gefunden" }, { status: 404 });
    }

    if (friendship.receiverId !== currentUser.userId) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    if (friendship.status !== "pending") {
      return NextResponse.json({ error: "Anfrage ist nicht mehr ausstehend" }, { status: 400 });
    }

    if (action === "accept") {
      // Update friendship to accepted
      await db.friendship.update({
        where: { id: friendshipId },
        data: { status: "accepted" }
      });
    } else {
      // Delete the friendship (reject)
      await db.friendship.delete({
        where: { id: friendshipId }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing friend request:", error);
    return NextResponse.json({ error: "Fehler beim Verarbeiten der Anfrage" }, { status: 500 });
  }
}