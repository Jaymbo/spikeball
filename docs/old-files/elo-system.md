---
title: ELO Rating System
tags: [elo, rating, algorithm]
---

# PROBLEM

ELO Rating System für 2v2 Spikeball Matches implementieren mit:
- Logarithmischer Rating Update System
- Team-basierte Berechnung (2v2)
- Inaktivitäts-Decay (5% pro Monat)
- History Tracking für Rating-Änderungen

# LÖSUNG

## ELO Calculation

### Rating Update Formula

```typescript
// Expected score calculation
const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

// Rating update
const newRating = playerRating + K_FACTOR * (actualScore - expectedScore);
```

### K-Factor
- Standard: 32
- Adjusted based on games played

### Team Rating Calculation

```typescript
// Average team rating
const teamRating = (player1.eloRating + player2.eloRating) / 2;
```

## Inactivity Decay

```typescript
// 5% decay per inactive month
const decayRate = 0.05;
const monthsInactive = calculateMonthsSinceLastPlayed();
const decayedRating = currentRating * Math.pow(1 - decayRate, monthsInactive);
```

## Game Recording Flow

1. **Validate Input:** 4 unique players, valid scores, no ties
2. **Calculate Team Ratings:** Average of both team members
3. **Calculate Expected Scores:** Based on team ratings
4. **Calculate Actual Scores:** 1 for winner, 0 for loser
5. **Update Ratings:** Apply K-factor to delta
6. **Create EloChange Records:** Store previous, new, and change
7. **Update Player Stats:** gamesPlayed, wins, losses

## Replay System

```typescript
// Full recalculation from game history
1. Reset all players to 1000 ELO
2. Clear all EloChange records
3. Process games chronologically
4. Apply ELO updates sequentially
```

# CODE / COMMANDS

```typescript
// Example ELO update
import { calculateEloChange } from '@/lib/elo';

const change = calculateEloChange({
  playerRating: 1200,
  opponentRating: 1100,
  actualScore: 1, // win
  kFactor: 32
});
// Returns: { newRating: 1216, change: 16 }
```

# SHELL OUTPUT / ERROR

Keine Fehler bei ELO-Berechnungen.

# WEITERE RESOURCES

- File: `src/lib/elo.ts`
- File: `src/app/api/games/route.ts`
- File: `src/app/api/replay/route.ts`