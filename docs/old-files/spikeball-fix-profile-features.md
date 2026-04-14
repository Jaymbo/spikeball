---
title: Spikeball Profile Features Fixes
tags: [spikeball, profile, authentication, api, bugfix]
---
# PROBLEM
Mehrere Probleme mit der Profil-Funktionalität in Spikeball:
1. Beim Klicken auf ein Profil kam ein "Application error: a client-side exception has occurred"
2. Profilbild-Upload war nicht möglich
3. Keine Möglichkeit, das eigene Profil zu sehen oder zu bearbeiten
4. Leaderboard API gab nicht alle benötigten Felder zurück (wins, losses, profilePicture)

# LÖSUNG
1. Leaderboard API erweitert, um alle Spieler-Statistiken zurückzugeben
2. Neue API-Route `/api/players/current-player` erstellt, um den zugehörigen Player eines Users zu finden
3. Leaderboard-Komponente aktualisiert, um currentUser zu empfangen und "Mein Profil" Button anzuzeigen
4. PlayerProfile-Komponente aktualisiert, um Profil-Eigentum dynamisch zu prüfen
5. Authentifizierung für Profilbild-Upload korrigiert

# CODE / COMMANDS

## 1. Leaderboard API erweitern (`spikeball/src/app/api/leaderboard/route.ts`)
```typescript
const leaderboard = visiblePlayers.map((player, index) => ({
  rank: index + 1,
  id: player.id,
  name: player.name,
  eloRating: player.eloRating,
  lastPlayedAt: player.lastPlayedAt,
  gamesPlayed: player.gamesPlayed,
  wins: player.wins,
  losses: player.losses,
  winRate: player.gamesPlayed > 0 ? (player.wins / player.gamesPlayed) * 100 : 0,
  createdAt: player.createdAt,
  profilePicture: player.profilePicture,
}));
```

## 2. Neue API-Route für aktuellen Player (`spikeball/src/app/api/players/current-player/route.ts`)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const player = await db.player.findFirst({
      where: {
        userId: user.userId
      }
    });

    if (!player) {
      return NextResponse.json(
        { currentPlayerId: null, hasPlayer: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      currentPlayerId: player.id,
      hasPlayer: true,
      player: {
        id: player.id,
        name: player.name,
        profilePicture: player.profilePicture,
      }
    });
  } catch (error) {
    console.error("Error fetching current player:", error);
    return NextResponse.json(
      { error: "Failed to fetch current player" },
      { status: 500 }
    );
  }
}
```

## 3. Leaderboard-Komponente aktualisieren
```typescript
// Props erweitern
interface LeaderboardProps {
  onRefreshTrigger: number;
  currentUser?: CurrentUser | null;
}

// State für aktuellen Player
const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

// Fetch aktuellen Player
const fetchCurrentPlayer = useCallback(async () => {
  if (!currentUser) {
    setCurrentPlayerId(null);
    return;
  }
  try {
    const res = await fetch("/api/players/current-player");
    if (res.ok) {
      const data = await res.json();
      setCurrentPlayerId(data.currentPlayerId);
    }
  } catch (err) {
    console.error("Error fetching current player:", err);
  }
}, [currentUser]);

// "Mein Profil" Button hinzufügen
{currentPlayerId && (
  <Button
    variant="outline"
    onClick={() => handleProfileClick(currentPlayerId)}
    className="shrink-0"
  >
    <User className="h-4 w-4 mr-2" />
    Mein Profil
  </Button>
)}

// Profile Dialog mit korrekten Props
<Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    {selectedPlayerId && (
      <PlayerProfile 
        playerId={selectedPlayerId} 
        isOwnProfile={selectedPlayerId === currentPlayerId}
        isAdmin={currentUser?.isAdmin || false}
        onClose={() => setProfileDialogOpen(false)} 
      />
    )}
  </DialogContent>
</Dialog>
```

## 4. PlayerProfile-Komponente aktualisieren
```typescript
// State für dynamische Eigentümer-Prüfung
const [isActuallyOwnProfile, setIsActuallyOwnProfile] = useState(false);

// Eigentümer-Prüfung im useEffect
useEffect(() => {
  const checkOwnership = async () => {
    const res = await fetch("/api/players/current-player");
    if (res.ok) {
      const data = await res.json();
      setIsActuallyOwnProfile(data.currentPlayerId === playerId);
    }
  };
  checkOwnership();
}, [playerId]);

// Bedingte Anzeige des Edit-Buttons
{(isActuallyOwnProfile || isAdmin) && (
  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
    <DialogTrigger asChild>
      <Button
        size="sm"
        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 shadow-md"
      >
        <Edit className="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Profilbild hochladen</DialogTitle>
      </DialogHeader>
      <AvatarUpload 
        playerId={playerId} 
        onSuccess={handleUploadSuccess}
      />
    </DialogContent>
  </Dialog>
)}
```

# SHELL OUTPUT / ERROR
Keine Fehler. Alle Änderungen wurden erfolgreich implementiert.

# WEITERE RESOURCES
- Leaderboard API: `spikeball/src/app/api/leaderboard/route.ts`
- Current Player API: `spikeball/src/app/api/players/current-player/route.ts`
- Leaderboard Component: `spikeball/src/components/spikeball/Leaderboard.tsx`
- PlayerProfile Component: `spikeball/src/components/profile/PlayerProfile.tsx`
- Profile Upload API: `spikeball/src/app/api/upload/profile-picture/route.ts`
---