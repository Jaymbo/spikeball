---
title: Complete Friendship Status Display Fix
tags: [friendship, status-display, frontend, player-profile, ui-fix]
---

# PROBLEM
Der Freundschafts-Status im PlayerProfile wurde nicht korrekt angezeigt. Das API-Endpunkt gibt 4 verschiedene Statuswerte zurück ("accepted", "incoming", "outgoing", oder null), aber die Komponente zeigte immer nur "Freund hinzufügen" an, selbst nachdem eine Anfrage gesendet wurde. Zudem fehlten die Handler-Funktionen fr Annehmen, Ablehnen, Abbrechen und Entfernen von Freundschaften.

# LÖSUNG
1. **API-Variablen korrigieren**: In `/api/players/[id]/route.ts` wurde die Variable `friendRequestStatus` zu `friendRequestType` korrigiert, um mit der Deklaration bereinstimmen zu sein
2. **Staten korrigieren**: In `PlayerProfile.tsx` wurde `friendRequestStatus` zu `friendRequestType` umbenannt (entspricht den API-Werten)
3. **Status-Badge erweitern**: `getFriendStatusBadge()` reagiert jetzt auf alle 4 Statuswerte: "accepted" (Befreundet), "incoming" (Eingehend), "outgoing" (Angefragt), null (kein Badge)
4. **Handler-Funktionen hinzufgen**: Implementiert fr `handleAcceptFriendRequest`, `handleRejectFriendRequest`, `handleCancelFriendRequest` und `handleRemoveFriend`
5. **Button-Logik erweitern**: Freund-Button zeigt jetzt je nach Status unterschiedliche Aktionen (Annehmen/Ablehnen fr eingehend, Abbrechen fr ausgehend, Entfernen fr befreundet)
6. **Autocomplete aktivieren**: In `AddFriendDialog.tsx` wurde die `UserAutocomplete`-Komponente integriert, um echte Benutzersuche zu ermglichen statt einfaches Input-Feld

# CODE / COMMANDS

## API Fix (players/[id]/route.ts)
```typescript
// Zeile 221 - korrigiert:
return NextResponse.json({
  ...,
  isFriend,
  friendRequestType, // korrigiert von friendRequestStatus
});
```

## PlayerProfile Handler-Funktionen (Auszug)
```typescript
// Incoming: Annehmen
const handleAcceptFriendRequest = async () => {
  // Find friendship and accept via POST /api/friends/requests
  // { action: "accept" }
  // Update state to "accepted"
};

// Incoming: Ablehnen
const handleRejectFriendRequest = async () => {
  // DELETE /api/friends/[id]
  // Set type to null
};

// Outgoing: Abbrechen
const handleCancelFriendRequest = async () => {
  // DELETE /api/friends/[id]
  // Set type to null
};

// Accepted: Entfernen
const handleRemoveFriend = async () => {
  // DELETE /api/friends/[id]
  // Set type to null, isFriend to false
};
```

## Status-Badge Update
```typescript
const getFriendStatusBadge = () => {
  if (isFriend || friendRequestType === "accepted") {
    return (
      <Badge variant="default" className="gap-1 shrink-0">
        <UserCheck className="h-3 w-3" />
        <span>Befreundet</span>
      </Badge>
    );
  }
  if (friendRequestType === "incoming") {
    return (
      <Badge variant="secondary" className="gap-1 shrink-0">
        <UserPlus className="h-3 w-3" />
        <span>Eingehend</span>
      </Badge>
    );
  }
  if (friendRequestType === "outgoing") {
    return (
      <Badge variant="outline" className="gap-1 shrink-0">
        <Clock className="h-3 w-3" />
        <span>Angefragt</span>
      </Badge>
    );
  }
  return null;
};
```

## AddFriendDialog mit Autocomplete
```typescript
// UserAutocomplete statt Input fr echte Suche:
<UserAutocomplete 
  onSelect={handleUserSelect}
  onBlur={handleAutocompleteBlur}
/>
```

# SHELL OUTPUT / ERROR
```
TypeScript Error: No value exists in scope for the shorthand property 'friendRequestStatus'. 
Severity: 8 (in /api/players/[id]/route.ts)

Error: Die Freundschaftsanfrage wurde gesendet, aber der Status im UI nderte sich nicht.
```

# WEITERE RESOURCESC
- Dateipfad: `spikeball/src/components/profile/PlayerProfile.tsx` - Status-Badges und Handler
- Dateipfad: `spikeball/src/app/api/players/[id]/route.ts` - API-Response Fix
- Dateipfad: `spikeball/src/components/friends/AddFriendDialog.tsx` - Autocomplete Integration
- Dokumentation: `docs/fix-friend-request-status-variable-name.md`
