---
title: API Routes - Endpoints
tags: [api, routes, endpoints]
---

# PROBLEM

API-Endpoints für Spikeball ELO System definieren und implementieren.

# LÖSUNG

## Auth Endpoints

### POST /api/auth/login
- User Login mit Username/Password
- Returns JWT Token in Cookie
- Requires Password Change on first login

### POST /api/auth/logout
- Clears auth cookie

### GET /api/auth/check
- Validates current session
- Returns user info if authenticated

## Player Endpoints

### GET /api/players
- Returns all players with stats
- Includes ELO, games played, wins, losses

### POST /api/players
- Creates new player (Admin only)
- Default password: 12345678
- Creates linked User entity

### PATCH /api/players
- Updates player name or resets password
- Password reset generates temporary password

### DELETE /api/players?id=...
- Deletes player (Admin only)
- Only if no games played

## Game Endpoints

### POST /api/games
- Records a new 2v2 match
- Calculates ELO changes for all 4 players
- Creates EloChange records
- Returns updated ratings

### DELETE /api/games?id=...
- Deletes a game
- Triggers full ELO recalculation (destructive)

### GET /api/games?limit=20&offset=0
- Returns paginated game history
- Includes ELO changes per player

## Leaderboard Endpoint

### GET /api/leaderboard
- Returns ranked player list
- Applies inactivity decay (5% per month)
- Includes win rates and stats

## Replay Endpoint

### POST /api/replay
- Resets all players to 1000 ELO
- Rebuilds from game history
- Destructive operation

## Friends Endpoints

### GET /api/friends
- Returns all accepted friendships
- Includes friend's player info

### POST /api/friends
- Sends friend request
- Validates: not self, not already friends
- Creates pending friendship

### GET /api/friends/requests
- Returns pending requests for current user

### GET /api/friends/sent
- Returns sent requests by current user

### GET /api/friends/pending-count
- Returns count of pending requests
- Used for badge notifications

### PATCH /api/friends/[id]
- Accepts friend request
- Updates status to "accepted"

### DELETE /api/friends/[id]
- Rejects request or deletes friendship

## User Profile Endpoints

### GET /api/users/[id]
- Returns detailed user profile
- Includes stats, recent games, ELO history
- Supports timeRange filter (month, 3months, year, allTime)
- Returns friend status

### GET /api/users/search?q=...
- Searches users by username
- Case-insensitive, min 2 chars
- Returns top 10 results

### GET /api/users/compare?user1=...&user2=...
- Compares two users
- Returns head-to-head stats
- Includes win rates and recent games

# CODE / COMMANDS

```bash
# Test API endpoints
curl http://localhost:3000/api/players
curl http://localhost:3000/api/leaderboard
```

# SHELL OUTPUT / ERROR

Keine kritischen Fehler bei API-Implementierung.

# WEITERE RESOURCES

- File: `src/app/api/` - All API route implementations
- File: `src/lib/auth.ts` - JWT token handling