/**
 * ELO Rating Calculation for Spikeball 2v2
 * 
 * Individual players are rated, but games are played as teams of 2.
 * The team's combined ELO determines expected outcome, and each
 * individual player's rating is updated accordingly.
 */

const K_FACTOR = 32;
const INITIAL_RATING = 1000;
const DECAY_RATE = 0.05; // 5% per month of inactivity

/**
 * Calculate expected score for a team based on average ELO
 */
export function calculateExpectedScore(teamAvgElo: number, opponentAvgElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentAvgElo - teamAvgElo) / 400));
}

/**
 * Calculate ELO change for a single player
 */
export function calculateEloChange(
  playerRating: number,
  teamAvgElo: number,
  opponentAvgElo: number,
  actualScore: number, // 1 for win, 0 for loss
): number {
  const expectedScore = calculateExpectedScore(teamAvgElo, opponentAvgElo);
  return Math.round(K_FACTOR * (actualScore - expectedScore));
}

/**
 * Process a completed game and return ELO changes for all 4 players
 * 
 * Each player is rated against the AVERAGE of the opposing team,
 * not their own team average.
 * Player 1 & 2 (Team 1) vs average of Players 3 & 4 (Team 2)
 * Player 3 & 4 (Team 2) vs average of Players 1 & 2 (Team 1)
 */
export function processGameElo(
  players: {
    team1Player1: { id: string; eloRating: number };
    team1Player2: { id: string; eloRating: number };
    team2Player1: { id: string; eloRating: number };
    team2Player2: { id: string; eloRating: number };
  },
  team1Score: number,
  team2Score: number,
): {
  team1Player1: { newRating: number; change: number };
  team1Player2: { newRating: number; change: number };
  team2Player1: { newRating: number; change: number };
  team2Player2: { newRating: number; change: number };
} {
  const team1Avg = (players.team1Player1.eloRating + players.team1Player2.eloRating) / 2;
  const team2Avg = (players.team2Player1.eloRating + players.team2Player2.eloRating) / 2;

  // Determine winner (1 = win, 0 = loss)
  const team1Won = team1Score > team2Score;
  const team1Actual = team1Won ? 1 : 0;
  const team2Actual = team1Won ? 0 : 1;

  // Team 1 players are rated against Team 2 average
  // Team 2 players are rated against Team 1 average
  const team1P1Change = calculateEloChange(
    players.team1Player1.eloRating,
    team1Avg,
    team2Avg,
    team1Actual,
  );
  const team1P2Change = calculateEloChange(
    players.team1Player2.eloRating,
    team1Avg,
    team2Avg,
    team1Actual,
  );
  const team2P1Change = calculateEloChange(
    players.team2Player1.eloRating,
    team2Avg,
    team1Avg,
    team2Actual,
  );
  const team2P2Change = calculateEloChange(
    players.team2Player2.eloRating,
    team2Avg,
    team1Avg,
    team2Actual,
  );

  return {
    team1Player1: {
      newRating: players.team1Player1.eloRating + team1P1Change,
      change: team1P1Change,
    },
    team1Player2: {
      newRating: players.team1Player2.eloRating + team1P2Change,
      change: team1P2Change,
    },
    team2Player1: {
      newRating: players.team2Player1.eloRating + team2P1Change,
      change: team2P1Change,
    },
    team2Player2: {
      newRating: players.team2Player2.eloRating + team2P2Change,
      change: team2P2Change,
    },
  };
}

/**
 * Calculate ELO decay for inactive players
 * 5% reduction per full calendar month of inactivity
 */
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
  
  // Calculate full calendar months of inactivity
  const monthsInactive = getFullMonthsDiff(referenceDate, now);
  
  if (monthsInactive <= 0) {
    return { newRating: eloRating, monthsInactive: 0 };
  }

  // Apply 5% decay per month (compound)
  const decayMultiplier = Math.pow(1 - DECAY_RATE, monthsInactive);
  const newRating = Math.max(100, Math.round(eloRating * decayMultiplier)); // Floor at 100

  return { newRating, monthsInactive };
}

/**
 * Get the number of full calendar months between two dates
 */
function getFullMonthsDiff(startDate: Date, endDate: Date): number {
  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
  months += endDate.getMonth() - startDate.getMonth();
  
  // Only count full months
  if (endDate.getDate() < startDate.getDate()) {
    months--;
  }
  
  return months;
}

/**
 * Generate balanced matchups for a set of players
 * Returns the most balanced team combinations
 */
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
  if (playerIds.length < 4) {
    return [];
  }

  const matchups: Array<{
    team1: [string, string];
    team2: [string, string];
    balanceScore: number;
    team1Avg: number;
    team2Avg: number;
  }> = [];

  // Generate all possible team combinations
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const remaining = playerIds.filter((_, idx) => idx !== i && idx !== j);
      
      for (let k = 0; k < remaining.length; k++) {
        for (let l = k + 1; l < remaining.length; l++) {
          const team1 = [playerIds[i], playerIds[j]] as [string, string];
          const team2 = [remaining[k], remaining[l]] as [string, string];

          const team1Avg = (playerRatings.get(team1[0])! + playerRatings.get(team1[1])!) / 2;
          const team2Avg = (playerRatings.get(team2[0])! + playerRatings.get(team2[1])!) / 2;

          // Balance score = absolute difference between team averages
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

  // Sort by balance score (most balanced first)
  matchups.sort((a, b) => a.balanceScore - b.balanceScore);

  // Deduplicate: Remove mirror matchups (same teams, different order)
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

  return unique.slice(0, 10); // Return top 10 most balanced matchups
}

/**
 * Generate a round-robin tournament schedule for 4+ players
 */
export function generateRoundRobin(
  playerIds: string[],
  playerRatings: Map<string, number>,
): Array<{
  round: number;
  games: Array<{
    team1: [string, string];
    team2: [string, string];
    balanceScore: number;
  }>;
}> {
  if (playerIds.length < 4) {
    return [];
  }

  const rounds: Array<{
    round: number;
    games: Array<{ team1: [string, string]; team2: [string, string]; balanceScore: number }>;
  }> = [];

  // Simple round-robin: pair up adjacent players after rotation
  const players = [...playerIds];
  let round = 1;

  // For each round, generate games from available players
  const numGames = Math.floor(players.length / 2);
  const usedPlayers = new Set<string>();

  for (let g = 0; g < numGames; g++) {
    const available = players.filter((p) => !usedPlayers.has(p));
    if (available.length < 4) break;

    const matchup = generateBalancedMatchups(available, playerRatings)[0];
    if (!matchup) break;

    usedPlayers.add(matchup.team1[0]);
    usedPlayers.add(matchup.team1[1]);
    usedPlayers.add(matchup.team2[0]);
    usedPlayers.add(matchup.team2[1]);

    if (!rounds[round - 1]) {
      rounds.push({ round, games: [] });
    }

    rounds[round - 1].games.push({
      team1: matchup.team1,
      team2: matchup.team2,
      balanceScore: matchup.balanceScore,
    });
  }

  return rounds.length > 0 ? rounds : [];
}

export { INITIAL_RATING, K_FACTOR, DECAY_RATE };
