import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - Liefert alle Feature Requests (Admin only)
export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const featureRequests = await db.featureRequest.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            player: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(featureRequests);
  } catch (error) {
    console.error("Error fetching feature requests:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Feature Requests" }, { status: 500 });
  }
}

// POST - Erstellt einen neuen Feature Request
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, title, description } = body;

    // Validierung
    if (!type || !["bug", "feature"].includes(type)) {
      return NextResponse.json({ error: "Ungültiger Typ (bug oder feature)" }, { status: 400 });
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ error: "Beschreibung ist erforderlich" }, { status: 400 });
    }

    if (title.length > 100) {
      return NextResponse.json({ error: "Titel darf maximal 100 Zeichen haben" }, { status: 400 });
    }

    if (description.length > 1000) {
      return NextResponse.json({ error: "Beschreibung darf maximal 1000 Zeichen haben" }, { status: 400 });
    }

    // Feature Request erstellen
    const featureRequest = await db.featureRequest.create({
      data: {
        userId: currentUser.userId,
        type,
        title: title.trim(),
        description: description.trim(),
        status: "open",
        priority: "low",
      },
    });

    return NextResponse.json({ 
      message: "Feature Request erstellt",
      featureRequest 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating feature request:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen des Feature Requests" }, { status: 500 });
  }
}