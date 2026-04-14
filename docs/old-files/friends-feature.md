---
title: Friends Feature Implementation
tags: [friends, feature, social]
---

# PROBLEM

User-Interaktion und Social Features für Spikeball ELO System implementieren:
- Freunde hinzufügen mit Autocomplete-Suche
- Freundschaftsanfragen senden/akzeptieren/ablehnen
- Anfrage-Status anzeigen (ausstehend/befreundet)
- Benachrichtigungen bei neuen Anfragen
- Suchfunktion für alle Listen

# LÖSUNG

## Database Schema

Friendship Model mit Status-Management:
- requesterId: User der Anfrage sendet
- receiverId: User der Anfrage empfängt
- status: "pending" oder "accepted"
- createdAt: Timestamp

## API Endpoints

### POST /api/friends
- Sendet Freundschaftsanfrage
- Validiert: nicht selbst, nicht bereits befreundet
- Returns: friendship object mit ID

### GET /api/friends
- Liefert alle akzeptierten Freundschaften
- Includes: friend's username, player info

### GET /api/friends/requests
- Liefert ausstehende Anfragen für aktuellen User
- Returns: username, playerName, createdAt

### GET /api/friends/sent
- Liefert gesendete Anfragen von aktuellem User
- Returns: username, playerName, createdAt

### GET /api/friends/pending-count
- Liefert Anzahl ausstehender Anfragen
- Used für Badge-Notifications

### PATCH /api/friends/[id]
- Akzeptiert Freundschaftsanfrage
- Updates status zu "accepted"

### DELETE /api/friends/[id]
- Lehnt ab oder löscht Freundschaft

## UI Components

### FriendsTab
- Hauptkomponente mit 3 Tabs: Freunde, Eingehend, Ausgehend
- Badge-Notification mit Anzahl
- Refresh-Button

### FriendList
- Zeigt alle akzeptierten Freunde
- Search-Input für Echtzeit-Filterung
- "Befreundet" Badge
- Remove-Button

### FriendRequests
- Zeigt eingehende Anfragen
- Search-Input
- Accept/Reject Buttons
- "Ausstehend" Badge

### SentRequests
- Zeigt gesendete Anfragen
- Search-Input
- Cancel-Button
- "Ausstehend" Badge

### AddFriendDialog
- Dialog zum Hinzufügen von Freunden
- UserAutocomplete Integration
- Search-Icon im Input

### UserAutocomplete
- Autocomplete-Suche für Usernames
- Debounced API-Calls (300ms)
- Dropdown mit User-Icon und Spielername
- Min 2 chars für Suche

## Notification System

### Badge Updates
- Roter Badge auf "Freunde" Tab im Hauptmenü
- Roter Badge auf "Eingehend" Tab
- Badge zeigt Anzahl der Anfragen

### Automatic Updates
- Polling alle 30 Sekunden
- Update bei Tab-Wechsel (visibility change)
- Update beim Login

# CODE / COMMANDS

```bash
# Test friend request
curl -X POST http://localhost:3000/api/friends \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'

# Check pending requests
curl http://localhost:3000/api/friends/pending-count
```

# SHELL OUTPUT / ERROR

Keine kritischen Fehler bei Friends-Feature.

# WEITERE RESOURCES

- File: `src/components/friends/FriendsTab.tsx`
- File: `src/components/friends/UserAutocomplete.tsx`
- File: `src/app/api/friends/route.ts`