---
title: Friendship Request UI State Mismatch
tags: [frontend, ui-state, friendship, button-state, api-integration]
---
# PROBLEM
Das Frontend zeigt den "Freundschaft anfragen" Button/Option an, obwohl bereits eine Freundschaftsanfrage im Status "pending" an diesen Benutzer existiert. Der User sollte gar nicht in der Lage sein, eine zweite Anfrage zu senden.

# LÖSUNG
1. UI muss den Friendship-Status (status: 'pending') berücksichtigen
2. Wenn status === 'pending', dann Button deaktivieren oder stattdessen "Anfrage ausstehend" anzeigen
3. Prüfe, ob der friendship-Status korrekt aus dem current-player Profil in das Frontend-Component prop übergeben wird
4. Option für "Anfrage zurückziehen" anzeigen statt erneut anfragen

# CODE / COMMANDS
```javascript
// Beispiel für UI-Logic
const canSendRequest = friendshipStatus !== 'pending';

<Button 
  disabled={!canSendRequest}
  onClick={handleSendRequest}
>
  {friendshipStatus === 'pending' 
    ? 'Anfrage ausstehend' 
    : 'Freundschaft anfragen'}
</Button>
```

# SHELL OUTPUT / ERROR
```
[POST /api/friends] Request from: Jason to: Nilsonato
[POST /api/friends] Existing friendship: pending
POST /api/friends 400 in 56ms
```

# WEITERE RESOURCES
- API Endpoint: GET /api/players/current-player (liefert friendship status)
- API Endpoint: POST /api/friends (verhindert doppelte Anfragen mit 400)
---