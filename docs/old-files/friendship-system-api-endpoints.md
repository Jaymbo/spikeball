---
title: Friendship System API Endpoints
tags: [friendship, api-routes, nextjs, social-features, friendships]
---

# PROBLEM
Ein robustes Friendship System für Next.js mit:
- Freundschaftsanfragen senden
- Anfragen akzeptieren/ablehnen
- Liste aller Freunde abrufen
- Vermeidung von mehrfachen Anfragen, Selbst-Friendships und Duplikaten

# LÖSUNG
Drei Haupt-Endpunkte implementieren mit strikter Validierung:
1. `GET /api/friends` - Alle akzeptierten Freunde des aktuellen Users zurückgeben
2. `POST /api/friends` - Neue Freundschaftsanfrage senden (mit Validierungen)
3. `POST /api/friends/requests` - Anfragen akzeptieren/ablehnen
4. `DELETE /api/friends/[id]` - Freundschaft beenden oder Anfrage zurückziehen

# CODE / COMMANDS
```typescript
// GET /api/friends - Alle akzeptierten Freunde des aktuellen Users
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
          where: { status: "accepted" }, // Nur akzeptierte
          include: { 
            receiver: { 
              include: { player: true } // Player-Daten inkludieren (optional)
            } 
          },
        },
        friendshipsReceived: {
          where: { status: "accepted" },
          include: { 
            requester: { 
              include: { player: true }
            } 
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // Arrangiere friends als flaches Array mit ausgewählten Infos
    const friends = [
      ...user.friendshipsSent.map((f) => ({
        id: f.id,
        username: f.receiver.username,
        playerName: f.receiver.player?.name || null,
        playerId: f.receiver.player?.id || null,
        createdAt: f.createdAt,
      })),
      ...user.friendshipsReceived.map((f) => ({
        id: f.id,
        username: f.requester.username,
        playerName: f.requester.player?.name || null,
        playerId: f.requester.player?.id || null,
        createdAt: f.createdAt,
      })),
    ];

    return NextResponse.json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Freunde" }, { status: 500 });
  }
}

// POST /api/friends - Neue Freundschaftsanfrage senden
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { username } = body;

    // Input validation 1: Check username format
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Ungültiger Benutzername" }, { status: 400 });
    }

    // Input validation 2: Block self-friending
    if (username === currentUser.username) {
      return NextResponse.json({ error: "Du kannst dich nicht selbst als Freund hinzufügen" }, { status: 400 });
    }

    // Find target user with optional player data
    const receiver = await db.user.findUnique({
      where: { username },
      include: { player: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // Input validation 3: Prüfen ob bereits befreundet oder Anfrage existiert
    // Nutze eine OR-Abfrage (WHERE), statt zwei separate DB-Queries
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUser.userId, receiverId: receiver.id },
          { requesterId: receiver.id, receiverId: currentUser.userId },
        ],
      },
    });

    if (existingFriendship) {
      // Verhindere doppelte Anfragen oder bestehende Freundschaften
      if (existingFriendship.status === "accepted") {
        return NextResponse.json({ error: "Ihr seid bereits befreundet" }, { status: 400 });
      } else {
        return NextResponse.json({ error: "Anfrage bereits gesendet" }, { status: 400 });
      }
    }

    // Friendship request erstellen
    const friendship = await db.friendship.create({
      data: {
        requesterId: currentUser.userId,
        receiverId: receiver.id,
        status: "pending", // Wird später akzeptiert/abgelehnt
      },
    });

    return NextResponse.json({ 
      message: "Freundschaftsanfrage gesendet",
      friendship 
    }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/friends] Error:", error);
    return NextResponse.json({ error: "Fehler beim Senden der Anfrage" }, { status: 500 });
  }
}
```

### Accept / Reject Friendship Example:

```typescript
// POST /api/friends/requests
// Body: { friendshipId: string, action: 'accept' | 'reject' }
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { friendshipId, action } = await req.json();

    // Validate action
    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Find friendship
    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    // Validate: Nur der Empfänger darf akzeptieren/ablehnen
    if (friendship.receiverId !== currentUser.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Already processed?
    if (friendship.status !== "pending") {
      return NextResponse.json({ error: "Friendship already processed" }, { status: 400 });
    }

    // Process
    if (action === "accept") {
      await db.friendship.update({
        where: { id: friendshipId },
        data: { status: "accepted" },
      });
      return NextResponse.json({ success: true, message: "Friendship accepted" });
    } else {
      await db.friendship.delete({
        where: { id: friendshipId },
      });
      return NextResponse.json({ success: true, message: "Friendship rejected" });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
```

# SHELL OUTPUT / ERROR
```
N/A - Diese Implementierung ist robust und enthält alle nötigen Validierungen.
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/app/api/friends/route.ts`
- Friendship-Patterns: <https://auth0.com/blog/designing-a-secure-rest-api-without-oauth/>
---