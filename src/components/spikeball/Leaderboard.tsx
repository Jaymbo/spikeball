"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Gamepad2,
  User,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import SearchInput from "@/components/ui/search-input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PlayerProfile } from "@/components/profile/PlayerProfile";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  eloRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  lastPlayedAt: string | null;
  createdAt: string;
}

interface CurrentUser {
  userId: string;
  username: string;
  isAdmin: boolean;
}

interface LeaderboardProps {
  onRefreshTrigger: number;
  currentUser?: CurrentUser | null;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="h-6 w-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
  }
}

function getEloTier(rating: number): { label: string; color: string } {
  if (rating >= 1400) return { label: "Grandmaster", color: "bg-red-500/10 text-red-600 border-red-200" };
  if (rating >= 1300) return { label: "Master", color: "bg-purple-500/10 text-purple-600 border-purple-200" };
  if (rating >= 1200) return { label: "Diamond", color: "bg-cyan-500/10 text-cyan-600 border-cyan-200" };
  if (rating >= 1100) return { label: "Platinum", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" };
  if (rating >= 1000) return { label: "Gold", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" };
  if (rating >= 900) return { label: "Silver", color: "bg-gray-500/10 text-gray-600 border-gray-200" };
  return { label: "Bronze", color: "bg-orange-500/10 text-orange-600 border-orange-200" };
}

function getLastPlayedText(lastPlayedAt: string | null): string {
  if (!lastPlayedAt) return "Noch nie gespielt";
  const date = new Date(lastPlayedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;
  if (diffDays < 30) return `Vor ${Math.floor(diffDays / 7)} Wochen`;
  if (diffDays < 365) return `Vor ${Math.floor(diffDays / 30)} Monaten`;
  return `Vor ${Math.floor(diffDays / 365)} Jahren`;
}

export default function Leaderboard({ onRefreshTrigger, currentUser }: LeaderboardProps) {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leaderboard?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentPlayer = useCallback(async () => {
    if (!currentUser) {
      setCurrentPlayerId(null);
      return;
    }
    try {
      const res = await fetch("/api/players/current-player");
      if (res.ok) {
        const data = await res.json();
        setCurrentPlayerId(data.currentPlayerId);
      }
    } catch (err) {
      console.error("Error fetching current player:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard, onRefreshTrigger]);

  useEffect(() => {
    fetchCurrentPlayer();
  }, [fetchCurrentPlayer]);

  const handleProfileClick = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setProfileDialogOpen(true);
  };

  if (loading && players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Trophy className="h-12 w-12 mb-4 animate-pulse" />
        <p>Lade Rangliste...</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Trophy className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Keine Spieler vorhanden</p>
        <p className="text-sm mt-1">Füge Spieler hinzu, um die Rangliste zu sehen.</p>
      </div>
    );
  }

  const topThree = filteredPlayers.slice(0, 3);
  const rest = filteredPlayers.slice(3);

  return (
    <div className="space-y-6">
      {/* Search and Refresh */}
      <div className="flex gap-2">
        {currentPlayerId && (
          <Button
            variant="outline"
            onClick={() => handleProfileClick(currentPlayerId)}
            className="shrink-0"
          >
            <User className="h-4 w-4 mr-2" />
            Mein Profil
          </Button>
        )}
        <SearchInput
          placeholder="Nach Spielername suchen..."
          onSearch={setSearchQuery}
          className="flex-1"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={fetchLeaderboard}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1st Place - Center */}
          <Card className="sm:order-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleProfileClick(topThree[0]?.id)}>
            <CardContent className="flex flex-col items-center pt-6">
              <div className="relative">
                <Trophy className="h-10 w-10 text-yellow-500 mb-2" />
              </div>
              <h3 className="text-xl font-bold">{topThree[0]?.name}</h3>
              <div className="text-3xl font-black text-yellow-600 mt-1">
                {topThree[0]?.eloRating}
              </div>
              <Badge className="mt-2" variant="outline">
                {getEloTier(topThree[0]?.eloRating ?? 1000).label}
              </Badge>
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gamepad2 className="h-4 w-4" />
                  {topThree[0]?.gamesPlayed}
                </span>
                <span className="text-green-600">{topThree[0]?.wins}W</span>
                <span className="text-red-500">{topThree[0]?.losses}L</span>
              </div>
            </CardContent>
          </Card>

          {/* 2nd Place - Left */}
          {topThree.length >= 2 && (
            <Card className="sm:order-1 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleProfileClick(topThree[1]?.id)}>
              <CardContent className="flex flex-col items-center pt-6">
                <Medal className="h-10 w-10 text-gray-400 mb-2" />
                <h3 className="text-lg font-bold">{topThree[1]?.name}</h3>
                <div className="text-2xl font-black text-gray-500 mt-1">
                  {topThree[1]?.eloRating}
                </div>
                <Badge className="mt-2" variant="outline">
                  {getEloTier(topThree[1]?.eloRating ?? 1000).label}
                </Badge>
                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="h-4 w-4" />
                    {topThree[1]?.gamesPlayed}
                  </span>
                  <span className="text-green-600">{topThree[1]?.wins}W</span>
                  <span className="text-red-500">{topThree[1]?.losses}L</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3rd Place - Right */}
          {topThree.length >= 3 && (
            <Card className="sm:order-3 border-amber-300 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleProfileClick(topThree[2]?.id)}>
              <CardContent className="flex flex-col items-center pt-6">
                <Medal className="h-10 w-10 text-amber-600 mb-2" />
                <h3 className="text-lg font-bold">{topThree[2]?.name}</h3>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {topThree[2]?.eloRating}
                </div>
                <Badge className="mt-2" variant="outline">
                  {getEloTier(topThree[2]?.eloRating ?? 1000).label}
                </Badge>
                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="h-4 w-4" />
                    {topThree[2]?.gamesPlayed}
                  </span>
                  <span className="text-green-600">{topThree[2]?.wins}W</span>
                  <span className="text-red-500">{topThree[2]?.losses}L</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Alle Spieler</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {rest.map((player) => {
                const tier = getEloTier(player.eloRating);
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 px-6 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleProfileClick(player.id)}
                  >
                    <div className="w-8 flex items-center justify-center">
                      {getRankIcon(player.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{player.name}</span>
                        <Badge variant="outline" className={`text-xs shrink-0 ${tier.color}`}>
                          {tier.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Gamepad2 className="h-3.5 w-3.5" />
                          {player.gamesPlayed} Spiele
                        </span>
                        <span className="text-green-600">{player.wins}W</span>
                        <span className="text-red-500">{player.losses}L</span>
                        <span>{getLastPlayedText(player.lastPlayedAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold">{player.eloRating}</div>
                      <Progress value={player.winRate} className="w-16 h-1.5 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold">{players.length}</div>
            <div className="text-xs text-muted-foreground">Spieler</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold">
              {players.reduce((sum, p) => sum + p.gamesPlayed, 0) / 4}
            </div>
            <div className="text-xs text-muted-foreground">Gesamte Spiele</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold">
              {Math.round(players.reduce((sum, p) => sum + p.eloRating, 0) / players.length)}
            </div>
            <div className="text-xs text-muted-foreground">Ø ELO</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold">
              {players.length > 0 ? Math.max(...players.map((p) => p.eloRating)) : 0}
            </div>
            <div className="text-xs text-muted-foreground">Höchstes ELO</div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent size="4xl" className="max-h-[90vh] overflow-y-auto">
          {selectedPlayerId && (
            <PlayerProfile 
              playerId={selectedPlayerId} 
              isOwnProfile={selectedPlayerId === currentPlayerId}
              isAdmin={currentUser?.isAdmin || false}
              onClose={() => setProfileDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
