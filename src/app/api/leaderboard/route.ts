import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateDecay } from '@/lib/elo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  await applyEloDecay();
  
  const players = await db.player.findMany({
    orderBy: { eloRating: 'desc' }
  });
  
  const visiblePlayers = players.filter(p => p.name !== 'root');
  
  const leaderboard = visiblePlayers.map((player, index) => ({
    rank: index + 1,
    id: player.id,
    name: player.name,
    eloRating: player.eloRating,
    lastPlayedAt: player.lastPlayedAt,
    gamesPlayed: player.gamesPlayed,
    wins: player.wins,
    losses: player.losses,
    winRate: player.gamesPlayed > 0 ? (player.wins / player.gamesPlayed) * 100 : 0,
    createdAt: player.createdAt,
    profilePicture: player.profilePicture,
  }));
  
  return NextResponse.json(leaderboard, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

async function applyEloDecay() {
  const players = await db.player.findMany({
    where: {
      lastPlayedAt: { not: null }
    }
  });
  
  for (const player of players) {
    const { newRating, monthsInactive } = calculateDecay(
      player.eloRating,
      player.lastPlayedAt,
      player.lastDecayAt
    );
    
    if (monthsInactive > 0 && newRating !== player.eloRating) {
      await db.player.update({
        where: { id: player.id },
        data: { 
          eloRating: newRating,
          lastDecayAt: new Date()
        }
      });
    }
  }
}
