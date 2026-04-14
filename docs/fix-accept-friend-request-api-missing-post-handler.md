---
title: Missing POST Handler for Accept Friend Request
tags: [api, friends, friendship, post, bugfix]
---
# PROBLEM
Klick auf "Annehmen" einer Freundschaftsanfrage im Profil führte zu einem Fehler, während "Ablehnen" funktionierte. Die Frontend-Komponente versuchte POST an `/api/friends/requests` zu senden, aber die Route hatte nur einen GET-Handler implementiert.

# LÖSUNG
1. POST-Handler zur `/api/friends/requests/route.ts` hinzugefügt
2. Handler validiert `friendshipId` und `action` (accept/reject)
3. Überprüft, dass der aktuelle User der Empfänger (`receiverId`) ist
4. Überprüft, dass die Anfrage noch "pending" ist
5. Bei "accept": Status auf "accepted" updaten
6. Bei "reject": Freundschaft aus Datenbank löschen

# CODE / COMMANDS

**Neuer POST-Handler in `src/app/api/friends/requests/route.ts`:**
```typescript
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
```

# SHELL OUTPUT / ERROR
Frontend-Fehler beim Klick auf "Annehmen": POST `/api/friends/requests` endpoint konnte nicht gefunden werden (405 Method Not Allowed).

# WEITERE RESOURCES
- API Route: `src/app/api/friends/requests/route.ts`
- Frontend Component: `src/components/profile/PlayerProfile.tsx`
---