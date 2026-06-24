/**
 * ELO Rating Calculation for Spikeball 2v2
 * 
 * New System:
 * - Percent-based calculation (0 to 1) instead of win/loss binary
 * - Elo-dependent win-bonus (anti-farming)
 * - Global participation bonus based on leaderboard rank
 * 
 * Individual players are rated, but games are played as teams of 2.
 */
export interface EloBreakdown {
  expectedAnteil: number;
  actualAnteil: number;
  perfDiff: number;
  duelScore: number;
  winBonus: number;
  participationBonus: number;
  totalChange: number;
}

// --- NEW CONSTANTS ---
const K_FACTOR = 28;                      // Performance volatility
const INITIAL_RATING = 1000;
const DECAY_RATE = 0.05;                 // 5% per month of inactivity

// Win Bonus Configuration
const MIN_WIN_BONUS = 3;                 // Minimum bonus for favorites
const BASE_WIN_BONUS = 12;               // Maximum bonus for underdogs
const WIN_SCALING_FACTOR = 12;           // Scaling range based on expected score

// Participation Bonus Configuration
const MAX_PARTICIPATION_BONUS = 5;       // Maximum for worst players

/**
 * Calculate expected score (probability) for a team based on average ELO
 * Returns: 0 to 1 (where 1 = certain win, 0 = certain loss)
 */
export function calculateExpectedScore(teamAvgElo: number, opponentAvgElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentAvgElo - teamAvgElo) / 400));
}

/**
 * Calculate actual score percentage based on game score
 * Returns: 0 to 1 (ownScore / totalScore)
 */
function calculateActualScore(ownScore: number, opponentScore: number): number {
  const total = ownScore + opponentScore;
  return total === 0 ? 0.5 : ownScore / total;
}

/**
 * Calculate ELO-dependent win bonus
 * - High expectedScore (favorite) → small bonus
 * - Low expectedScore (underdog) → large bonus
 */
function calculateWinBonus(expectedScore: number): number {
  const bonus = MIN_WIN_BONUS + WIN_SCALING_FACTOR * (1 - expectedScore);
  return Math.round(Math.max(MIN_WIN_BONUS, Math.min(BASE_WIN_BONUS, bonus)));
}

/**
 * Calculate global participation bonus based on leaderboard rank
 * Linear distribution: rank 1 gets 0, last rank gets MAX_PARTICIPATION_BONUS
 */
export function calculateGlobalParticipationBonus(rank: number, totalPlayers: number): number {
  if (rank < 1 || rank > totalPlayers) return 0;
  
  const bonus = Math.round(
    (MAX_PARTICIPATION_BONUS * (rank - 1)) / (totalPlayers - 1)
  );
  
  return Math.min(MAX_PARTICIPATION_BONUS, Math.max(0, bonus));
}

/**
 * Calculate complete ELO change for a single player
 * 
 * Components:
 * 1. Performance Diff: (actual - expected) * K_FACTOR
 * 2. Win Bonus (if won, scaled by expected score)
 * 3. Participation Bonus (based on global rank)
 */
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
  breakdown: {
    expectedAnteil: number;
    actualAnteil: number;
    perfDiff: number;
    duelScore: number;
    winBonus: number;
    participationBonus: number;
    totalChange: number;
  };
} {
  // 1. Expected percentage (0 to 1)
  const expectedAnteil = calculateExpectedScore(ownTeamAvgElo, opponentAvgElo);
  
  // 2. Actual percentage from score (0 to 1)
  const actualAnteil = calculateActualScore(ownScore, opponentScore);
  
  // 3. Performance difference
  const perfDiff = actualAnteil - expectedAnteil;
  const duelScore = K_FACTOR * perfDiff;
  
  // 4. ELO-dependent win bonus
  const won = ownScore > opponentScore;
  const winBonus = won ? calculateWinBonus(expectedAnteil) : 0;
  
  // 5. Global participation bonus
  const participationBonus = calculateGlobalParticipationBonus(globalRank, totalPlayers);
  
  // 6. Total change
  const totalChange = Math.round(duelScore + winBonus + participationBonus);
  
  return {
    newRating: playerRating + totalChange,
    change: totalChange,
    breakdown: {
      expectedAnteil,
      actualAnteil,
      perfDiff,
      duelScore: Math.round(duelScore * 100) / 100,
      winBonus,
      participationBonus,
      totalChange
    }
  };
}

/**
 * Process a completed game and return ELO changes for all 4 players
 * 
 * Each player is rated against the AVERAGE of the opposing team.
 * Individual participation bonuses are based on global leaderboard rank.
 */
export function processGameElo(
  players: {
    team1Player1: { id: string; eloRating: number; globalRank: number };
    team1Player2: { id: string; eloRating: number; globalRank: number };
    team2Player1: { id: string; eloRating: number; globalRank: number };
    team2Player2: { id: string; eloRating: number; globalRank: number };
  },
  team1Score: number,
  team2Score: number,
  totalPlayers: number  // Total players in leaderboard for participation bonus
): {
  team1Player1: { newRating: number; change: number; breakdown: any };
  team1Player2: { newRating: number; change: number; breakdown: any };
  team2Player1: { newRating: number; change: number; breakdown: any };
  team2Player2: { newRating: number; change: number; breakdown: any };
} {
  const team1Avg = (players.team1Player1.eloRating + players.team1Player2.eloRating) / 2;
  const team2Avg = (players.team2Player1.eloRating + players.team2Player2.eloRating) / 2;

  // Calculate for each player using new system
  const team1P1Result = calculateEloChange(
    players.team1Player1.eloRating,
    team1Avg,
    team2Avg,
    team1Score,
    team2Score,
    players.team1Player1.globalRank,
    totalPlayers
  );
  
  const team1P2Result = calculateEloChange(
    players.team1Player2.eloRating,
    team1Avg,
    team2Avg,
    team1Score,
    team2Score,
    players.team1Player2.globalRank,
    totalPlayers
  );
  
  const team2P1Result = calculateEloChange(
    players.team2Player1.eloRating,
    team2Avg,
    team1Avg,
    team2Score,
    team1Score,
    players.team2Player1.globalRank,
    totalPlayers
  );
  
  const team2P2Result = calculateEloChange(
    players.team2Player2.eloRating,
    team2Avg,
    team1Avg,
    team2Score,
    team1Score,
    players.team2Player2.globalRank,
    totalPlayers
  );

  return {
    team1Player1: team1P1Result,
    team1Player2: team1P2Result,
    team2Player1: team2P1Result,
    team2Player2: team2P2Result,
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
  const round = 1;

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

/**
 * Calculate global ranks for a set of players based on their ELO ratings
 * Returns a map of playerId -> rank (1 = highest ELO)
 */
export function calculateGlobalRanks(
  players: Array<{ id: string; eloRating: number }>
): Map<string, number> {
  // Sort by ELO descending
  const sorted = [...players].sort((a, b) => b.eloRating - a.eloRating);
  
  const ranks = new Map<string, number>();
  sorted.forEach((player, index) => {
    ranks.set(player.id, index + 1);
  });
  
  return ranks;
}