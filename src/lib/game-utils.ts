import { db } from './db';
import { processGameElo, calculateGlobalRanks } from './elo';
import { Prisma } from '@prisma/client';

const INITIAL_RATING = 1000;

export interface PlayerWithElo {
  id: string;
  eloRating: number;
  globalRank: number;
}

export interface EloResultMap {
  team1Player1: { id: string; newRating: number; change: number };
  team1Player2: { id: string; newRating: number; change: number };
  team2Player1: { id: string; newRating: number; change: number };
  team2Player2: { id: string; newRating: number; change: number };
}

export interface PreviousRatingsMap {
  team1Player1: number;
  team1Player2: number;
  team2Player1: number;
  team2Player2: number;
}

/**
 * Update player stats after a game
 * - Updates ELO rating
 * - Increments gamesPlayed, wins/losses
 * - Updates lastPlayedAt
 */
export async function updatePlayerStats(
  playerId: string,
  newRating: number,
  won: boolean,
  playedAt: Date
) {
  return db.player.update({
    where: { id: playerId },
    data: {
      eloRating: newRating,
      gamesPlayed: { increment: 1 },
      wins: { increment: won ? 1 : 0 },
      losses: { increment: won ? 0 : 1 },
      lastPlayedAt: playedAt,
    },
  });
}

/**
 * Create ELO change records for a game
 */
export async function createEloChangeRecords(
  gameId: string,
  eloResults: EloResultMap,
  previousRatings: PreviousRatingsMap
) {
  return db.eloChange.createMany({
    data: [
      {
        playerId: eloResults.team1Player1.id,
        gameId,
        previousRating: previousRatings.team1Player1,
        newRating: eloResults.team1Player1.newRating,
        change: eloResults.team1Player1.change,
      },
      {
        playerId: eloResults.team1Player2.id,
        gameId,
        previousRating: previousRatings.team1Player2,
        newRating: eloResults.team1Player2.newRating,
        change: eloResults.team1Player2.change,
      },
      {
        playerId: eloResults.team2Player1.id,
        gameId,
        previousRating: previousRatings.team2Player1,
        newRating: eloResults.team2Player1.newRating,
        change: eloResults.team2Player1.change,
      },
      {
        playerId: eloResults.team2Player2.id,
        gameId,
        previousRating: previousRatings.team2Player2,
        newRating: eloResults.team2Player2.newRating,
        change: eloResults.team2Player2.change,
      },
    ],
  });
}

/**
 * Replay a single game within a transaction
 * Used for recalculation after deletion
 */
export async function replayGame(
  tx: Omit<typeof db, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  game: {
    team1Player1Id: string;
    team1Player2Id: string;
    team2Player1Id: string;
    team2Player2Id: string;
    team1Score: number;
    team2Score: number;
    id: string;
    playedAt: Date;
  }
) {
  const playerIds = [
    game.team1Player1Id,
    game.team1Player2Id,
    game.team2Player1Id,
    game.team2Player2Id,
  ];

  const currentPlayers = await tx.player.findMany({
    where: { id: { in: playerIds } },
  });

  const p1 = currentPlayers.find((p) => p.id === game.team1Player1Id);
  const p2 = currentPlayers.find((p) => p.id === game.team1Player2Id);
  const p3 = currentPlayers.find((p) => p.id === game.team2Player1Id);
  const p4 = currentPlayers.find((p) => p.id === game.team2Player2Id);

  if (!p1 || !p2 || !p3 || !p4) {
    throw new Error('Replay failed: one or more players not found');
  }

  // Calculate global ranks for participation bonus
  const allPlayers = await tx.player.findMany({
    orderBy: { eloRating: 'desc' },
  });
  const totalPlayers = allPlayers.length;
  const ranks = calculateGlobalRanks(allPlayers);

  const eloResult = processGameElo(
    {
      team1Player1: {
        id: p1.id,
        eloRating: p1.eloRating,
        globalRank: ranks.get(p1.id) || 1,
      },
      team1Player2: {
        id: p2.id,
        eloRating: p2.eloRating,
        globalRank: ranks.get(p2.id) || 1,
      },
      team2Player1: {
        id: p3.id,
        eloRating: p3.eloRating,
        globalRank: ranks.get(p3.id) || 1,
      },
      team2Player2: {
        id: p4.id,
        eloRating: p4.eloRating,
        globalRank: ranks.get(p4.id) || 1,
      },
    },
    game.team1Score,
    game.team2Score,
    totalPlayers
  );

  const team1Won = game.team1Score > game.team2Score;

  // Update all 4 players
  await updatePlayerStatsInTx(p1.id, eloResult.team1Player1.newRating, team1Won, game.playedAt, tx);
  await updatePlayerStatsInTx(p2.id, eloResult.team1Player2.newRating, team1Won, game.playedAt, tx);
  await updatePlayerStatsInTx(p3.id, eloResult.team2Player1.newRating, !team1Won, game.playedAt, tx);
  await updatePlayerStatsInTx(p4.id, eloResult.team2Player2.newRating, !team1Won, game.playedAt, tx);

  // Create EloChange records
  await tx.eloChange.createMany({
    data: [
      {
        playerId: p1.id,
        gameId: game.id,
        previousRating: p1.eloRating,
        newRating: eloResult.team1Player1.newRating,
        change: eloResult.team1Player1.change,
      },
      {
        playerId: p2.id,
        gameId: game.id,
        previousRating: p2.eloRating,
        newRating: eloResult.team1Player2.newRating,
        change: eloResult.team1Player2.change,
      },
      {
        playerId: p3.id,
        gameId: game.id,
        previousRating: p3.eloRating,
        newRating: eloResult.team2Player1.newRating,
        change: eloResult.team2Player1.change,
      },
      {
        playerId: p4.id,
        gameId: game.id,
        previousRating: p4.eloRating,
        newRating: eloResult.team2Player2.newRating,
        change: eloResult.team2Player2.change,
      },
    ],
  });
}

/**
 * Helper function for updating player stats within a transaction
 */
async function updatePlayerStatsInTx(
  playerId: string,
  newRating: number,
  won: boolean,
  playedAt: Date,
  tx: Omit<typeof db, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
) {
  return tx.player.update({
    where: { id: playerId },
    data: {
      eloRating: newRating,
      gamesPlayed: { increment: 1 },
      wins: { increment: won ? 1 : 0 },
      losses: { increment: won ? 0 : 1 },
      lastPlayedAt: playedAt,
    },
  });
}
