---
title: Update - Fix Race Condition in Friendship Display
tags: [race-condition, profile, friendship, optimization]
---
# PROBLEM
Die Freundschafte-Buttons im Profil wurden beim ersten Laden oft nicht angezeigt. Grund war eine Race Condition: Der Profile-API-Call lieferte `friendRequestType` und `friendshipId`, aber `currentUserId` wurde erst asynchron durch einen separaten API-Call geladen. Das UI warte auf `currentUserId` um Buttons zu rendern - wenn dieser noch `null` war, wurden die Buttons nicht gerendert ('Freund hinzufügen' etc).

# LÖSUNG
1. Die API `/api/players/[id]` berechnet jetzt direkt auf Server-Seite, ob das Profil das eigene ist (`isOwnProfile`) und gibt es zurück.
2. Das Frontend nutzt `isOwnProfile` direkt aus dem API-Response statt asynchron nachzuladen.
3. `currentUserId` wird nur noch geladen, wenn es wirklich gebraucht wird (für Friendship-Operationen), blockiert aber nicht mehr das UI.

# CODE / COMMANDS

**API-Route - spikeball/src/app/api/players/[id]/route.ts**:
```typescript
// Include isOwnProfile to avoid additional fetch
const isOwnProfile = currentPlayerId === playerId;

// Return in response
return NextResponse.json({
  // ... other data
  friendshipId,
  isOwnProfile, // NEU
});
```

**Frontend Component - spikeball/src/components/profile/PlayerProfile.tsx**:
```typescript
const [isActuallyOwnProfile, setIsActuallyOwnProfile] = useState(false);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

// Setze isOwnProfile direkt aus API-Response
const fetchPlayerData = async () => {
  const res = await fetch(`/api/players/${playerId}`);
  const data = await res.json();
  setIsActuallyOwnProfile(data.isOwnProfile || false);
  // ...
};

// currentUserId wird asynchron nachgeladen, blockiert aber nicht mehr UI
const fetchCurrentUserId = async () => {
  if (isActuallyOwnProfile) return; // Nicht nötig bei eigenem Profil
  
  try {
    const res = await fetch("/api/players/current-player");
    const data = await res.json();
    setCurrentUserId(data.currentPlayerId);
  } catch (err) {
    console.error("[PlayerProfile] Error fetching current user:", err);
  }
};

// UI rendert sofort basierend auf isOwnProfile
const showFriendButton = !isActuallyOwnProfile && !loading;
```

# SHELL OUTPUT / ERROR
Vorher view doch man das Problem:
- Profile lädt -> Buttons werden nicht angezeigt
- Erst nach 200-400ms erscheinen die Buttons (wenn currentUserId endlich geladen war)
- Browser-Log zeigte, dass `/api/current-player` erst NACH dem Profil ausgeführt wurde

# WEITERE RESOURCES
- API: `spikeball/src/app/api/players/[id]/route.ts`
- Component: `spikeball/src/components/profile/PlayerProfile.tsx`
---