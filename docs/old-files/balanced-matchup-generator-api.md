---
title: Balanced Matchup Generator API
tags: [elo, matchmaking, algorithm, api-routes, league-features]
---

# PROBLEM
Für ein Spikeball-Liquid-System müssen faire Teams generiert werden basierend auf den ELO-Ratings aller teilnehmenden Spieler. Der Algorithmus muss alle Kombinationen durchlaufen und die ausgeglichensten Paarungen bestimmen.

# LÖSUNG
Kombinativer Algorithmus, der:
1. Alle möglichen 2v2 Team-Kombinationen generiert
2. Für jede Kombination den Balance-Score (Differenz der Team-Durchschnitte) berechnet
3. Después sortiert nach score (niedriger = ausgeglichener)
4. Duplikate entfernt (da Team A vs Team B = Team B vs Team A)
5. Top 10 ausgeglichene Matchups zurückgibt

# CODE / COMMANDS
```typescript
// POST /api/generate-games
// Body: { playerIds: string[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerIds } = body;

    // Input Validation
    if (!Array.isArray(playerIds) || playerIds.length < 4) {
      return NextResponse.json(
        { error: "At least 4 players are required" },
        { status: 400 },
      );
    }

    if (playerIds.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 players supported" },
        { status: 400 },
      );
    }

    // Check for duplicate player selections
    if (new Set(playerIds).size !== playerIds.length) {
      return NextResponse.json(
        { error: "Duplicate players not allowed" },
        { status: 400 },
      );
    }

    // Fetch players from DB
    const players = await db.player.findMany({
      where: { id: { in: playerIds } },
    });

    if (players.length !== playerIds.length) {
      return NextResponse.json(
        { error: "One or more players not found" },
        { status: 404 },
      );
    }

    // Build rating map: { playerId -> eloRating }
    const ratingMap = new Map<string, number>();
    for (const player of players) {
      ratingMap.set(player.id, player.eloRating);
    }

    // Generate balanced matchups with algorithm from @/lib/elo.ts
    const matchups = generateBalancedMatchups(playerIds, ratingMap);

    // Enrich matchups with player names and additional data
    const enrichedMatchups = matchups.map((matchup) => ({
      team1: {
        player1: {
          id: matchup.team1[0],
          name: players.find((p) => p.id === matchup.team1[0])!.name,
          eloRating: ratingMap.get(matchup.team1[0])!,
        },
        player2: {
          id: matchup.team1[1],
          name: players.find((p) => p.id === matchup.team1[1])!.name,
          eloRating: ratingMap.get(matchup.team1[1])!,
        },
      },
      team2: {
        player1: {
          id: matchup.team2[0],
          name: players.find((p) => p.id === matchup.team2[0])!.name,
          eloRating: ratingMap.get(matchup.team2[0])!,
        },
        player2: {
          id: matchup.team2[1],
          name: players.find((p) => p.id === matchup.team2[1])!.name,
          eloRating: ratingMap.get(matchup.team2[1])!,
        },
      },
      balanceScore: matchup.balanceScore, // Lower = more balanced
      team1Avg: Math.round(matchup.team1Avg),
      team2Avg: Math.round(matchup.team2Avg),
    }));

    return NextResponse.json({
      matchups: enrichedMatchups,
      availablePlayers: players.length,
    });
  } catch (error) {
    console.error("Error generating games:", error);
    return NextResponse.json(
      { error: "Failed to generate games" },
      { status: 500 },
    );
  }
}

// Algorithmus (aus @/lib/elo.ts)
export function generateBalancedMatchups(
  playerIds: string[],
  playerRatings: Map<string, number>,
): Array<{
  team1: [string, string];
  team2: [string, string];
  balanceScore: number; // Kleiner = ausgeglichener
  team1Avg: number;
  team2Avg: number;
}> {
  if (playerIds.length < 4) {
    return [];
  }

  const matchups: Array<
    // ... type definition ...
  > = [];

  // Generiere alle mögliche Team-Kombinationen (n^4 Komplexität)
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const remaining = playerIds.filter((_, idx) => idx !== i && idx !== j);
      
      for (let k = 0; k < remaining.length; k++) {
        for (let l = k + 1; l < remaining.length; l++) {
          const team1 = [playerIds[i], playerIds[j]] as [string, string];
          const team2 = [remaining[k], remaining[l]] as [string, string];

          const team1Avg = (playerRatings.get(team1[0])! + playerRatings.get(team1[1])!) / 2;
          const team2Avg = (playerRatings.get(team2[0])! + playerRatings.get(team2[1])!) / 2;

          // Balance Score = absolute Differenz kleiner ist besser
          const balanceScore = Math.abs(team1Avg - team2Avg);

          matchups.push({
            team1,
            team2,
            balanceScore,
            team1Avg,
            team2Avg,
          });
        }
      }
    }
  }

  // Sortiere nach score (niedrigste Differenz zuerst)
  matchups.sort((a, b) => a.balanceScore - b.balanceScore);

  // Entferne Mirror(matchups) - Team A vs Team B ist gleich Team B vs Team A
  const seen = new Set<string>();
  const unique: typeof matchups = [];
  
  for (const matchup of matchups) {
    const key = [
      ...matchup.team1.sort(),
      'vs',
      ...matchup.team2.sort(),
    ].join(',');
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(matchup);
    }
  }

  return unique.slice(0, 10); // Nur top 10.
}
```

# SHELL OUTPUT / ERROR
```
N/A - Der Algorithmus ist deterministisch und liefert immer die gleichen Ergebnisse für gegebenes Input.
``` 

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/app/api/generate-games/route.ts`
- Matchmaking Algorithms: <https://www.researchgate.net/publication/221235486_In_Skill-based_Games>_Implementation_and_Evaluation_of_Matchmaking_System_Time_Complexity
- Combinatorial Pairing: <https://en.wikipedia.org/wiki/Pairing_function>
---