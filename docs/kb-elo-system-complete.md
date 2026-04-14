---
title: ELO System - Complete Logic
tags: [elo, rating, algorithm, spikeball]
---
# PROBLEM

Implementierung eines vollständigen ELO-Rating-Systems für 2v2-Teams, bei dem jedoch **individuelle Spieler** bewertet werden. Das System muss Spielhistorien speichern, Inaktivitäts-Decay anwenden und ausgeglichene Matchups generieren.

# LÖSUNG

1. **Basis-Berechnung (Expected Score):** Wahrscheinlichkeit basierend auf Differenz der durchschnittlichen Team-ELOs.
2. **Update-Logik:** Jeder Spieler wird gegen den Durchschnitt des GEGNER-Teams bewertet (nicht sein eigenes).
3. **Inaktivitäts-Decay:** 5% Reduktion pro vollem Kalendermonat der Inaktivität, abhängig von `lastPlayedAt` oder `lastDecayAt`.
4. **History Tracking:** Speichere pro Spieler und Spiel `EloChange` (prev, new, delta).
5. **Replay System:** Möglichkeit, alle Ratings zurückzusetzen und basierend auf der Chronologie neu zu berechnen.

# CODE / COMMANDS

```typescript
const K_FACTOR = 32;
const INITIAL_RATING = 1000;
const DECAY_RATE = 0.05; // 5% pro Monat

// Expected Score: 0 bis 1
function calculateExpectedScore(teamAvgElo: number, opponentAvgElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentAvgElo - teamAvgElo) / 400));
}

// ELO-Update für einen Spieler
function calculateEloChange(
  playerRating: number,
  teamAvgElo: number,
  opponentAvgElo: number,
  actualScore: number, // 1 für Win, 0 für Loss
): number {
  const expectedScore = calculateExpectedScore(teamAvgElo, opponentAvgElo);
  return Math.round(K_FACTOR * (actualScore - expectedScore));
}

// Decay berechnen
function calculateDecay(
  eloRating: number,
  lastPlayedAt: Date | null,
  lastDecayAt: Date | null,
): { newRating: number; monthsInactive: number } {
  if (!lastPlayedAt) return { newRating: eloRating, monthsInactive: 0 };
  
  const now = new Date();
  const referenceDate = lastDecayAt || lastPlayedAt;
  
  let months = (now.getFullYear() - referenceDate.getFullYear()) * 12;
  months += now.getMonth() - referenceDate.getMonth();
  if (now.getDate() < referenceDate.getDate()) months--;
  
  if (months <= 0) return { newRating: eloRating, monthsInactive: 0 };

  const decayMultiplier = Math.pow(1 - DECAY_RATE, months);
  const newRating = Math.max(100, Math.round(eloRating * decayMultiplier));
  
  return { newRating, monthsInactive: months };
}
```

# SHELL OUTPUT / ERROR

Keine Fehler bei Berechnungen. WICHTIG: Nach Decay muss `lastDecayAt` im DB-Record aktualisiert werden, damit nicht doppelt abgezogen wird.

# WEITERE RESOURCES

- File: `src/lib/elo.ts`
- File: `src/app/api/games/route.ts` (Game processing)
- File: `src/app/api/replay/route.ts` (Recalculation)