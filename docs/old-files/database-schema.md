---
title: Database Schema - Prisma
tags: [database, prisma, sqlite, schema]
---

# PROBLEM

Datenbankstruktur für Spikeball ELO System mit User-Authentifizierung, Player-Management, Game-Tracking und Friendship-System.

# LÖSUNG

## Core Models

### User
- Authentifizierungs-Entity mit JWT Token Support
- Verknüpft mit Player Entity (1:1 optional)
- Beziehungen zu Friendship (requester/receiver)

### Player
- Haupt-Entity für ELO Ratings und Stats
- Verknüpft mit User (optional für Gäste)
- Beziehungen zu Games (4 Rollen: Team1P1, Team1P2, Team2P1, Team2P2)
- Beziehungen zu EloChange (History)

### Game
- Repräsentiert ein 2v2 Match
- Enthält Scores und PlayedAt Timestamp
- Beziehungen zu 4 Playern und EloChanges

### EloChange
- Speichert Rating-Änderungen pro Spieler pro Spiel
- Enthält previousRating, newRating, change delta

### Friendship
- Verwaltet User-Freundschaften
- Status: "pending" oder "accepted"
- Bidirektionale Beziehungen (requester/receiver)

# CODE / COMMANDS

```prisma
model User {
  id                      String   @id @default(cuid())
  username                String   @unique
  passwordHash            String
  isAdmin                 Boolean  @default(false)
  requiresPasswordChange  Boolean  @default(false)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  player                  Player?
  friendshipsSent         Friendship[] @relation("FriendshipsSent")
  friendshipsReceived     Friendship[] @relation("FriendshipsReceived")
}

model Player {
  id            String   @id @default(cuid())
  userId        String?  @unique
  name          String   @unique
  eloRating     Float    @default(1000)
  gamesPlayed   Int      @default(0)
  wins          Int      @default(0)
  losses        Int      @default(0)
  lastPlayedAt  DateTime?
  lastDecayAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User?    @relation(fields: [userId], references: [id])
  eloChanges    EloChange[]
  gamesTeam1P1  Game[]   @relation("Team1Player1")
  gamesTeam1P2  Game[]   @relation("Team1Player2")
  gamesTeam2P1  Game[]   @relation("Team2Player1")
  gamesTeam2P2  Game[]   @relation("Team2Player2")
}

model Game {
  id              String   @id @default(cuid())
  team1Player1Id  String
  team1Player2Id  String
  team2Player1Id  String
  team2Player2Id  String
  team1Score      Int
  team2Score      Int
  1PlayedAt       DateTime @default(now())
  createdAt       DateTime @default(now())
  team1Player1    Player   @relation("Team1Player1", fields: [team1Player1Id], references: [id])
  team1Player2    Player   @relation("Team1Player2", fields: [team1Player2Id], references: [id])
  team2Player1    Player   @relation("Team2Player1", fields: [team2Player1Id], references: [id])
  team2Player2    Player   @relation("Team2Player2", fields: [team2Player2Id], references: [id])
  eloChanges      EloChange[]
}

model EloChange {
  id             String   @id @default(cuid())
  playerId       String
  gameId         String
  previousRating Float
  newRating      Float
  change         Float
  createdAt      DateTime @default(now())
  player         Player   @relation(fields: [playerId], references: [id])
  game           Game     @relation(fields: [gameId], references: [id])
}

model Friendship {
  id          String   @id @default(cuid())
  requesterId String
  receiverId  String
  status      String   @default("pending")
  createdAt   DateTime @default(now())
  requester   User     @relation("FriendshipsSent", fields: [requesterId], references: [id])
  receiver    User     @relation("FriendshipsReceived", fields: [receiverId], references: [id], onDelete: Cascade)
  @@unique([requesterId, receiverId])
}
```

# SHELL OUTPUT / ERROR

Keine Fehler bei Schema-Updates.

# WEITERE RESOURCES

- File: `prisma/schema.prisma`
- File: `src/lib/db.ts` - Prisma Client Konfiguration