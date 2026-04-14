---
title: Duplicate Friendship Request Validation
tags: [api, friendship, validation, http-400]
---
# PROBLEM
Die API gibt einen HTTP-400 (Bad Request) zurück, wenn versucht wird, eine Freundschaftsanfrage zu senden, obwohl zwischen den beiden Benutzern bereits eine Freundschaftsanfrage im Status "pending" existiert. Das erlaubt es dem Client nicht, denselben Request erneut zu senden.

# LÖSUNG
1. Auf Client-Seite den Friendship-Status prüfen, bevor ein POST /api/friends Request gesendet wird
2. UI sollte "Already pending" anzeigen, wenn status === 'pending'
3. API-Validation log sollte korrekt erkennen: "Existing friendship: pending"

# CODE / COMMANDS
```
POST /api/friends
[POST /api/friends] Request from: Jason to: Nilsonato
[POST /api/friends] Found user: Nilsonato id: cmndiyoa20000l04g29bigdls
[POST /api/friends] Existing friendship: pending
POST /api/friends 400 in 56ms
```

# SHELL OUTPUT / ERROR
```
POST /api/friends 400 in 56ms
```

# WEITERE RESOURCES
- API Endpoint: `/api/friends`
- Player IDs: cmndiyoaf0002l04g12zyrwd2 (Jason), cmndiyoa20000l04g29bigdls (Nilsonato)
---