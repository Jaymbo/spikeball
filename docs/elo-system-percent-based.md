"---
title: Elo-System Prozent-basiert mit Anti-Farming
tags: [elo, rating, algorithm, spikeball, typescript]
---
# PROBLEM
Das alte Elo-System war binär (nur Win/Loss) und berücksichtigte nicht:
1. Wie eng ein Spiel war (Kiffergebnis bei Underdog wurde wie Blowout gewertet)
2. Anti-Farming: Gute Spieler konnten schlechte Spieler farmen und immer Pluspunkte bekommen
3. Motivation für schlechte Spieler: Keine Belohnung für Teilhabe

# LÖSUNG
Neues Elo-System mit drei Komponenten:
1. **Performance-Diff**: Prozent-basierte Berechnung (0 bis 1) statt binär
2. **Elo-abhängiger Win-Bonus**: Skaliert invers zum Erwartungswert (Anti-Farming)
3. **Globaler Participation-Bonus**: Linear nach Rang (0 bis 5 Punkte)

# CODE / COMMANDS

## Neue Konstanten
```typescript
const K_FACTOR = 28;                      // Performance volatility
const MIN_WIN_BONUS = 3;                 // Minimum für Favoriten
const BASE_WIN_BONUS = 12;               // Maximum für Underdogs
const WIN_SCALING_FACTOR = 12;           // Skalierungsbreite
const MAX_PARTICIPATION_BONUS = 5;       // Max für schlechteste Ränge
```

## Erwarteter Score (Elo → Prozent)
```typescript
function calculateExpectedScore(teamAvgElo: number, opponentAvgElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentAvgElo - teamAvgElo) / 400));
}
```

## Tatsächlicher Score (Score → Prozent)
```typescript
function calculateActualScore(ownScore: number, opponentScore: number): number {
  const total = ownScore + opponentScore;
  return total === 0 ? 0.5 : ownScore / total;
}
```

## Elo-abhängiger Win-Bonus
```typescript
function calculateWinBonus(expectedScore: number): number {
  const bonus = MIN_WIN_BONUS + WIN_SCALING_FACTOR * (1 - expectedScore);
  return Math.round(Math.max(MIN_WIN_BONUS, Math.min(BASE_WIN_BONUS, bonus)));
}
```

## Globaler Participation-Bonus
```typescript
function calculateGlobalParticipationBonus(rank: number, totalPlayers: number): number {
  if (rank < 1 || rank > totalPlayers) return 0;
  const bonus = Math.round(
    (MAX_PARTICIPATION_BONUS * (rank - 1)) / (totalPlayers - 1)
  );
  return Math.min(MAX_PARTICIPATION_BONUS, Math.max(0, bonus));
}
```

## Komplette Berechnung
```typescript
export function calculateEloChange(
  playerRating: number,
  ownTeamAvgElo: number,
  opponentAvgElo: number,
  ownScore: number,
  opponentScore: number,
  globalRank: number,
  totalPlayers: number
): {
  newRating: number;
  change: number;
  breakdown: { expectedAnteil, actualAnteil, perfDiff, duelScore, winBonus, participationBonus, totalChange };
} {
  const expectedAnteil = calculateExpectedScore(ownTeamAvgElo, opponentAvgElo);
  const actualAnteil = calculateActualScore(ownScore, opponentScore);
  const perfDiff = actualAnteil - expectedAnteil;
  const duelScore = K_FACTOR * perfDiff;
  const won = ownScore > opponentScore;
  const winBonus = won ? calculateWinBonus(expectedAnteil) : 0;
  const participationBonus = calculateGlobalParticipationBonus(globalRank, totalPlayers);
  const totalChange = Math.round(duelScore + winBonus + participationBonus);
  
  return {
    newRating: playerRating + totalChange,
    change: totalChange,
    breakdown: { expectedAnteil, actualAnteil, perfDiff, duelScore, winBonus, participationBonus, totalChange }
  };
}
```

# SHELL OUTPUT / ERROR
Keine Fehler bei der Implementierung.

# WEITERE RESOURCES
- File: `src/lib/elo.ts`
- File: `src/app/api/games/route.ts`
- File: `src/app/api/replay/route.ts`
"