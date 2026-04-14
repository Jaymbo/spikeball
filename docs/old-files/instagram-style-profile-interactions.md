---
title: Instagram Style Profile Interactions
tags: [ui, ux, profile, interactions, players-tab]
---
# PROBLEM
Die Profilinteraktionen waren nicht intuitiv. Komplette Zeile war klickbar, was zum Profil führte. Keine Möglichkeit, Profilbilder separat anzuzeigen oder hochzuladen. Fehler wenn kein Profilbild existierte.

# LÖSUNG
1. **Klick auf Profilbild** = Großes Profilbild im Viewer anzeigen (wie Instagram)
2. **Klick auf Namen** = Zum Profil gehen
3. **Plus-Button** = Profilbild hochladen (sichtbar für Admins und eigene Profile)
4. **Null-Sichere Profilbilder** = `undefined` statt `null` für Image-Komponenten

# CODE / COMMANDS
```typescript spikeball/src/components/spikeball/PlayersTabUpdated.tsx
// Klick auf Avatar = Bild anzeigen
<Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-orange-500 transition-all" 
  onClick={() => handleViewImage(player.profilePicture)}>
  <AvatarImage src={player.profilePicture || undefined} alt={player.name} />
  <AvatarFallback>...</AvatarFallback>
</Avatar>

// Klick auf Name = Profil öffnen
<button className="font-medium truncate block text-left hover:text-primary transition-colors"
  onClick={() => handleViewProfile(player.id)}>
  {player.name}
</button>

// Plus-Button = Upload Dialog
<Button variant="ghost" size="icon" onClick={(e) => handleUploadOpen(player.id, e)}>
  <Plus className="h-4 w-4" />
</Button>

// Image Viewer Dialog
<Dialog open={imageViewerOpen} onOpenChange={(open) => {
  setImageViewerOpen(open);
  if (!open) setViewingImage(null);
}}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
    <div className="relative w-full aspect-square bg-black">
      <Image src={viewingImage || "/"} fill className="object-contain" />
    </div>
  </DialogContent>
</Dialog>
```

```typescript spikeball/src/components/profile/PlayerProfile.tsx
// Null-Sichere Bilddarstellung
<AvatarImage src={player.profilePicture || undefined} alt={player.name} />
<AvatarImage src={game.team1Player1.profilePicture || undefined} />
<AvatarImage src={game.team2Player1.profilePicture || undefined} />

// Player Check
if (!playerData || !playerData.player) {
  return <Card>Profil nicht gefunden</Card>;
}
const { player, eloHistory, gameHistory } = playerData;
if (!player) {
  return <Card>Spieler nicht gefunden</Card>;
}
```

# SHELL OUTPUT / ERROR
Keine Fehler.

# WEITERE RESOURCEN
- Datei: `spikeball/src/components/spikeball/PlayersTabUpdated.tsx`
- Datei: `spikeball/src/components/profile/PlayerProfile.tsx`
- Datei: `spikeball/src/components/profile/AvatarUpload.tsx`

# NEUE FEATURES
- ✅ **Instagram Style Interaktionen**: Klick auf Bild vs. Name
- ✅ **Profilbild Viewer**: Großes Bild in Schwarzem Dialog
- ✅ **Upload Button**: Plus-Icon sichtbar für berechtigte Benutzer
- ✅ **Hover Effects**: Ring um Avatar beim Drüberfahren
- ✅ **Null-Safe**: Keine Fehler bei fehlenden Profilbildern
---