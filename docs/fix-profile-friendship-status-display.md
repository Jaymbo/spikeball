---
title: Fix - Profile Friendship Status Display
tags: [ friendship, profile, optimization, api ]
---
# PROBLEM
Freundschafts-Status im Profil wurde nicht korrekt angezeigt, da redundante API-Abfragen zu inkonsistenten Daten führten. Das Frontend lud das Profil, aber führte dann für jede Aktion (Annehmen, Ablehnen, Entfernen) erneute /api/friends-Calls aus und suchte manuell nach der friendshipId.

# LÖSUNG
1. API-Optimierung: Die /api/players/[id]-Route liefert jetzt auch die `friendshipId` direkt mit zurück (nur wenn eine Friendship existiert und es nicht das eigene Profil ist).
2. Frontend-Optimierung: PlayerProfile.tsx speichert die `friendshipId` und nutzt sie direkt für alle Friendship-Aktionen, anstatt erneut die /api/friends-Route aufzurufen und zu suchen.
3. Entfernung unnötiger Logs und Code-Reduzierung für bessere Performance.

# CODE / COMMANDS

**API-Route - spikeball/src/app/api/players/[id]/route.ts**:
```typescript
// Check friendship status - OPTIMIZED: Include friendship ID for efficient operations
let isFriend = false;
let friendRequestType: string | null = null;
let friendshipId: string | null = null;

if (currentPlayerId && currentPlayerId !== playerId) {
  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: currentPlayerId, receiverId: playerId },
        { requesterId: playerId, receiverId: currentPlayerId }
      ]
    }
  });
  
  if (friendship) {
    friendshipId = friendship.id; // Store ID for direct use
    isFriend = friendship.status === "accepted";
    
    if (friendship.status === "accepted") {
      friendRequestType = "accepted";
    } else if (friendship.requesterId === currentPlayerId) {
      friendRequestType = "outgoing";
    } else if (friendship.requesterId === playerId) {
      friendRequestType = "incoming";
    }
  }
}

// Return also friendshipId in response
return NextResponse.json({
  // ... other data
  isFriend,
  friendRequestType,
  friendshipId,
});
```

**Frontend Component - spikeball/src/components/profile/PlayerProfile.tsx**:
```typescript
const [friendshipId, setFriendshipId] = useState<string | null>(null);

// Store friendshipId from API response
const fetchPlayerData = async () => {
  // ...
  const data = await res.json();
  setPlayerData(data);
  setIsFriend(data.isFriend || false);
  setFriendRequestType(data.friendRequestType || null);
  setFriendshipId(data.friendshipId || null); // NEW
};

// Use friendshipId directly - no more extra /api/friends calls
const handleAcceptFriendRequest = async () => {
  if (!friendshipId) {
    toast.error("Friendship ID fehlt");
    return;
  }
  
  setFriendRequestLoading(true);
  try {
    const acceptRes = await fetch("/api/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        friendshipId: friendshipId, // Use direct ID
        action: "accept" 
      }),
    });
    // ...
  }
};
```

# SHELL OUTPUT / ERROR
Vorher im Browser-Log zu sehen:
- Viele redundante `GET /api/friends` Requests auf einmal
- Zeitweise "Friendship ID fehlt" oder falsche Buttons angezeigt

# WEITERE RESOURCES
- Schema: `prisma/schema.prisma` (Model Friendship mit requesterId, receiverId, status)
- API: `spikeball/src/app/api/players/[id]/route.ts`
- Component: `spikeball/src/components/profile/PlayerProfile.tsx`
---