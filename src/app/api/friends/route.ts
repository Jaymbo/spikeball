import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - Liefert alle Freunde des aktuellen Users
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: currentUser.userId },
      include: {
        friendshipsSent: {
          where: { status: "accepted" },
          include: { receiver: { include: { player: { select: { id: true, name: true, profilePicture: true } } } } },
        },
        friendshipsReceived: {
          where: { status: "accepted" },
          include: { requester: { include: { player: { select: { id: true, name: true, profilePicture: true } } } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    const friends = [
      ...user.friendshipsSent.map((f) => ({
        id: f.id,
        username: f.receiver.username,
        playerName: f.receiver.player?.name || null,
        playerId: f.receiver.player?.id || null,
        profilePicture: f.receiver.player?.profilePicture || undefined,
        createdAt: f.createdAt,
      })),
      ...user.friendshipsReceived.map((f) => ({
        id: f.id,
        username: f.requester.username,
        playerName: f.requester.player?.name || null,
        playerId: f.requester.player?.id || null,
        profilePicture: f.requester.player?.profilePicture || undefined,
        createdAt: f.createdAt,
      })),
    ];

    return NextResponse.json(friends);
  } catch (error) {
    console.error("[Friends] Error fetching friends:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Freunde" }, { status: 500 });
  }
}

// POST - Sendet eine Freundschaftsanfrage
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Ungültiger Benutzername" }, { status: 400 });
    }

    if (username === currentUser.username) {
      return NextResponse.json({ error: "Du kannst dich nicht selbst als Freund hinzufügen" }, { status: 400 });
    }

    // Empfänger suchen
    const receiver = await db.user.findUnique({
      where: { username },
      include: { player: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // Prüfen ob bereits befreundet oder Anfrage existiert
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUser.userId, receiverId: receiver.id },
          { requesterId: receiver.id, receiverId: currentUser.userId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return NextResponse.json({ error: "Ihr seid bereits befreundet" }, { status: 400 });
      } else {
        return NextResponse.json({ error: "Anfrage bereits gesendet" }, { status: 400 });
      }
    }

    // Freundschaftsanfrage erstellen
    const friendship = await db.friendship.create({
      data: {
        requesterId: currentUser.userId,
        receiverId: receiver.id,
        status: "pending",
      },
    });

    return NextResponse.json({ 
      message: "Freundschaftsanfrage gesendet",
      friendshipId: friendship.id,
    }, { status: 201 });
  } catch (error) {
    console.error("[Friends] Error creating friend request:", error);
    return NextResponse.json({ error: "Fehler beim Senden der Anfrage" }, { status: 500 });
  }
}