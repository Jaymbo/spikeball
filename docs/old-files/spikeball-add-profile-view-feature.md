---
title: Spikeball Profile View Integration
tags: [spikeball, frontend, profile, leaderboard, dialog]
---
# PROBLEM
Spikeball hatte bereits eine vollständige Profil-Komponente (PlayerProfile.tsx) implementiert, die Details wie Profilbild, ELO-Verlauf und Spielhistorie anzeigt. Diese Profile waren jedoch nicht auf der Hauptseite ersichtlich oder ansprechbar. Nutzer konnten nicht auf Spieler in der Leaderboard klicken, um deren Profil zu sehen.

# LÖSUNG
1. Import von Dialog-Komponenten und PlayerProfile in Leaderboard.tsx
2. State-Variablen hinzugefügt (selectedPlayerId, profileDialogOpen)
3. handleProfileClick-Funktion implementiert
4. Alle Spieler-Karten in der Leaderboard klickbar gemacht (Podium und Liste)
5. Dialog-Komponente am Ende der Leaderboard hinzugefügt

# CODE / COMMANDS
```typescript
// Imports hinzufügen
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PlayerProfile } from "@/components/profile/PlayerProfile";

// State im Component
const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
const [profileDialogOpen, setProfileDialogOpen] = useState(false);

// Handler-Funktion
const handleProfileClick = (playerId: string) => {
  setSelectedPlayerId(playerId);
  setProfileDialogOpen(true);
};

// Podium Cards klickbar machen
<Card onClick={() => handleProfileClick(topThree[0]?.id)} className="cursor-pointer hover:shadow-lg transition-shadow">
  // ... content
</Card>

// Leaderboard Zeilen klickbar machen
<div onClick={() => handleProfileClick(player.id)} className="cursor-pointer">
  // ... content
</div>

// Dialog am Ende des Components
<Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    {selectedPlayerId && (
      <PlayerProfile 
        playerId={selectedPlayerId} 
        onClose={() => setProfileDialogOpen(false)} 
      />
    )}
  </DialogContent>
</Dialog>
```

# SHELL OUTPUT / ERROR
Keine Fehler. Die Profile-Funktionalität war bereits vorhanden im Pfad `src/components/profile/PlayerProfile.tsx`.

# WEITERE RESOURCES
- Profil-Komponente: `spikeball/src/components/profile/PlayerProfile.tsx`
- Leaderboard-Komponente: `spikeball/src/components/spikeball/Leaderboard.tsx`
---