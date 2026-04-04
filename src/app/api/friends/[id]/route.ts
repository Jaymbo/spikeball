import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// PATCH - Akzeptiert eine Freundschaftsanfrage
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const { action } = await req.json();

    if (action !== "accept") {
      return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
    }

    const friendship = await db.friendship.findUnique({
      where: { id: params.id },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Freundschaft nicht gefunden" }, { status: 404 });
    }

    if (friendship.receiverId !== currentUser.userId) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    if (friendship.status !== "pending") {
      return NextResponse.json({ error: "Anfrage bereits bearbeitet" }, { status: 400 });
    }

    const updated = await db.friendship.update({
      where: { id: params.id },
      data: { status: "accepted" },
    });

    return NextResponse.json({ message: "Freundschaft akzeptiert", friendship: updated });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return NextResponse.json({ error: "Fehler beim Akzeptieren" }, { status: 500 });
  }
}

// DELETE - Lehnt ab oder löscht bestehende Freundschaft
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const friendship = await db.friendship.findUnique({
      where: { id: params.id },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Freundschaft nicht gefunden" }, { status: 404 });
    }

    // Nur der Empfänger kann ablehnen, oder beide können eine akzeptierte Freundschaft löschen
    const isReceiver = friendship.receiverId === currentUser.userId;
    const isRequester = friendship.requesterId === currentUser.userId;

    if (!isReceiver && !isRequester) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    await db.friendship.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Freundschaft entfernt" });
  } catch (error) {
    console.error("Error deleting friendship:", error);
    return NextResponse.json({ error: "Fehler beim Entfernen" }, { status: 500 });
  }
}