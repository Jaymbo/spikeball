---
title: ELO Rating System for Spikeball 2v2
tags: [elo, rating, game-logic, matchmaking, spikeball]
---

# PROBLEM
Implementierung eines ELO-Rating-Systems für 2v2-Teams, wobei jedoch **individuelle Spieler** bewertet werden, nicht das Team. Die ELO-Änderungen müssen korrekt auf alle 4 Spieler angewendet werden, mit Berücksichtigung von Inaktivität (Decay).

# LÖSUNG
1. Berechne Expected Score basierend auf Durchschnitts-ELO des gegnerischen Teams
2. Jeder Spieler wird gegen den Durchschnitt des Gegnerteams bewertet
3. Implementiere ELO Decay für inaktive Spieler (5% pro vollen Kalendermonat)
4. Generiere ausgeglichene Matchups basierend auf Differenz der Team-Durchschnitte

# CODE / COMMANDS
```typescript
const K_FACTOR = 32;
const INITIAL_RATING = 1000;
const DECAY_RATE = 0.05; // 5% pro Monat Inaktivität

// Expected Score: 0 bis 1 (Wahrscheinlichkeiten)
export function calculateExpectedScore(teamAvgElo: number, opponentAvgElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentAvgElo - teamAvgElo) / 400));
}

// ELO-Änderung für einen Spieler berechnen
export function calculateEloChange(
  playerRating: number,
  teamAvgElo: number,
  opponentAvgElo: number,
  actualScore: number, // 1 für Win, 0 für Loss
): number {
  const expectedScore = calculateExpectedScore(teamAvgElo, opponentAvgElo);
  return Math.round(K_FACTOR * (actualScore - expectedScore));
}

// WICHTIG: Jeder Spieler wird gegen den Durchschnitt des GEGNERTEAMS bewertet, nicht seines eigenen Teams!
export function processGameElo(
  players: {
    team1Player1: { id: string; eloRating: number };
    team1Player2: { id: string; eloRating: number };
    team2Player1: { id: string; eloRating: number };
    team2Player2: { id: string; eloRating: number };
  },
  team1Score: number,
  team2Score: number,
) {
  const team1Avg = (players.team1Player1.eloRating + players.team1Player2.eloRating) / 2;
  const team2Avg = (players.team2Player1.eloRating + players.team2Player2.eloRating) / 2;

  const team1Won = team1Score > team2Score;
  const team1Actual = team1Won ? 1 : 0;
  const team2Actual = team1Won ? 0 : 1;

  return {
    team1Player1: {
      newRating: players.team1Player1.eloRating + calculateEloChange(
        players.team1Player1.eloRating, team1Avg, team2Avg, team1Actual
      ),
      change: calculateEloChange(
        players.team1Player1.eloRating, team1Avg, team2Avg, team1Actual
      ),
    },
    // ... Gleiche Logik für team1Player2
    // ...
  };
}

// ELO Decay: 5% pro vollem Kalendermonat der Inaktivität
export function calculateDecay(
  eloRating: number,
  lastPlayedAt: Date | null,
  lastDecayAt: Date | null,
): { newRating: number; monthsInactive: number } {
  if (!lastPlayedAt) {
    return { newRating: eloRating, monthsInactive: 0 };
  }

  const now = new Date();
  const referenceDate = lastDecayAt || lastPlayedAt;
  const monthsInactive = getFullMonthsDiff(referenceDate, now);
  
  if (monthsInactive <= 0) {
    return { newRating: eloRating, monthsInactive: 0 };
  }

  // Compund interest: jeder Monat 5% weniger
  const decayMultiplier = Math.pow(1 - DECAY_RATE, monthsInactive);
  const newRating = Math.max(100, Math.round(eloRating * decayMultiplier)); // Minimum: 100

  return { newRating, monthsInactive };
}

// Nur volle Kalendermonate zählen
function getFullMonthsDiff(startDate: Date, endDate: Date): number {
  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
  months += endDate.getMonth() - startDate.getMonth();
  
  if (endDate.getDate() < startDate.getDate()) {
    months--;
  }
  
  return months;
}

// Ausgeglichene Matchups generieren (Lowest absolute difference)
export function generateBalancedMatchups(
  playerIds: string[],
  playerRatings: Map<string, number>,
): Array<{
  team1: [string, string];
  team2: [string, string];
  balanceScore: number; // Lower is more balanced
  team1Avg: number;
  team2Avg: number;
}> {
  // Generiere alle mögliche Kombinationen
  // Sortiere nach balanceScore (abs(team1Avg - team2Avg))
  // Return top 10
}
```

# SHELL OUTPUT / ERROR
```
N/A - Mathematical calculation, no runtime errors expected if implemented correctly.
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/lib/elo.ts`
- ELO Rating System: <https://en.wikipedia.org/wiki/Elo_rating_system>
- Decay Mechanism for Inactive Players: <https://lichess.org/faq#elo>
---