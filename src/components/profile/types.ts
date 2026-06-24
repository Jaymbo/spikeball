// Shared types for profile components

export interface Game {
  id: string;
  team1Player1: { id: string; name: string; eloRating: number };
  team1Player2: { id: string; name: string; eloRating: number };
  team2Player1: { id: string; name: string; eloRating: number };
  team2Player2: { id: string; name: string; eloRating: number };
  team1Score: number;
  team2Score: number;
  playedAt: string;
}

export interface EloHistoryEntry {
  id: string;
  change: number;
  newRating: number;
  previousRating: number;
  createdAt: string;
  game?: {
    id: string;
    team1Score: number;
    team2Score: number;
    playedAt: string;
  } | null;
}

export interface PlayerEloData {
  playerId: string;
  playerName: string;
  eloHistory: EloHistoryEntry[];
  color: string;
}
