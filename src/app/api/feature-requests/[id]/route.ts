import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// PATCH - Aktualisiert einen Feature Request (Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // Prüfen ob Admin
  const user = await db.user.findUnique({
    where: { id: currentUser.userId },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, priority } = body;

    // Validierung
    const validStatuses = ["open", "in_progress", "done", "rejected"];
    const validPriorities = ["low", "medium", "high"];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Ungültige Priorität" }, { status: 400 });
    }

    // Feature Request aktualisieren
    const featureRequest = await db.featureRequest.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
      },
    });

    return NextResponse.json({ 
      message: "Feature Request aktualisiert",
      featureRequest 
    });
  } catch (error) {
    console.error("Error updating feature request:", error);
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Feature Requests" }, { status: 500 });
  }
}

// DELETE - Löscht einen Feature Request (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // Prüfen ob Admin
  const user = await db.user.findUnique({
    where: { id: currentUser.userId },
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    await db.featureRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Feature Request gelöscht" });
  } catch (error) {
    console.error("Error deleting feature request:", error);
    return NextResponse.json({ error: "Fehler beim Löschen des Feature Requests" }, { status: 500 });
  }
}