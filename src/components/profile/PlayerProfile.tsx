"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, Calendar, History, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AvatarUpload } from "./AvatarUpload";

interface PlayerProfileProps {
  playerId: string;
  isOwnProfile?: boolean;
  isAdmin?: boolean;
  onClose?: () => void;
}

export function PlayerProfile({ playerId, isOwnProfile = false, isAdmin = false, onClose }: PlayerProfileProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isActuallyOwnProfile, setIsActuallyOwnProfile] = useState(false);

  const fetchPlayerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("[PlayerProfile] Fetching data for playerId:", playerId);
      const res = await fetch(`/api/players/${playerId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("[PlayerProfile] Received data:", data);
      
      if (!data.player) {
        throw new Error("Invalid response: missing player data");
      }
      
      setPlayerData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[PlayerProfile] Error fetching data:", err);
      setError(errorMessage);
      toast.error("Profil konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const checkOwnership = useCallback(async () => {
    try {
      const res = await fetch("/api/players/current-player");
      if (res.ok) {
        const data = await res.json();
        setIsActuallyOwnProfile(data.currentPlayerId === playerId);
      }
    } catch (err) {
      console.error("[PlayerProfile] Error checking ownership:", err);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  useEffect(() => {
    checkOwnership();
  }, [checkOwnership]);

  const handleUploadSuccess = (newPath: string) => {
    if (!playerData) return;
    
    setPlayerData({
      ...playerData,
      player: { ...playerData.player, profilePicture: newPath },
    });
    setUploadDialogOpen(false);
    toast.success("Profilbild erfolgreich hochgeladen");
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium">Fehler beim Laden des Profils</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
        <Button 
          onClick={fetchPlayerData}
          className="mt-4"
          variant="outline"
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  // Not Found State
  if (!playerData || !playerData.player) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <p>Profil nicht gefunden</p>
      </div>
    );
  }

  const { player, eloHistory, gameHistory } = playerData;
  const winRate = player.gamesPlayed > 0 
    ? ((player.wins / player.gamesPlayed) * 100).toFixed(1) 
    : "0.0";

  console.log("[PlayerProfile] Rendering for player:", player.name);

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={player.profilePicture || undefined} alt={player.name} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                    {player.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {(isActuallyOwnProfile || isAdmin) && (
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 shadow-md"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Profilbild hochladen</DialogTitle>
                      </DialogHeader>
                      <AvatarUpload 
                        playerId={playerId} 
                        onSuccess={handleUploadSuccess}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold">{player.name}</h2>
                  {isActuallyOwnProfile && (
                    <Badge variant="secondary" className="text-xs">
                      Du
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Seit {new Date(player.createdAt).toLocaleDateString("de-DE")}
                  </div>
                  {player.lastPlayedAt && (
                    <div className="flex items-center gap-1">
                      <History className="h-4 w-4" />
                      Zuletzt aktiv: {new Date(player.lastPlayedAt).toLocaleDateString("de-DE")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Trophy className="h-4 w-4" />
                ELO Rating
              </div>
              <div className="text-4xl font-bold text-orange-600">
                {player.eloRating.toFixed(1)}
              </div>
              {(eloHistory.length > 0) && (
                <div className={`text-sm font-medium mt-1 flex items-center gap-1 justify-end ${
                  eloHistory[0].change >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  <TrendingUp className="h-4 w-4" />
                  {eloHistory[0].change >= 0 ? "+" : ""}
                  {eloHistory[0].change.toFixed(1)}
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{player.gamesPlayed}</div>
              <div className="text-xs text-muted-foreground">Spiele</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-600">{player.wins}</div>
              <div className="text-xs text-muted-foreground">Siege</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-red-600">{player.losses}</div>
              <div className="text-xs text-muted-foreground">Niederlagen</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-blue-600">{winRate}%</div>
              <div className="text-xs text-muted-foreground">Win-Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Tabs for Details */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">
            <Trophy className="h-4 w-4 mr-2" />
            Info
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Verlauf
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil-Informationen</CardTitle>
              <CardDescription>Basis-Informationen zum Spieler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>ELO:</strong> {player.eloRating.toFixed(1)}</p>
                <p><strong>Spiele:</strong> {player.gamesPlayed}</p>
                <p><strong>Siege:</strong> {player.wins}</p>
                <p><strong>Niederlagen:</strong> {player.losses}</p>
                <p><strong>Win-Rate:</strong> {winRate}%</p>
                <p><strong>Mitglied seit:</strong> {new Date(player.createdAt).toLocaleDateString("de-DE")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Spiel-Historie</CardTitle>
              <CardDescription>Die letzten {gameHistory.length} Spiele</CardDescription>
            </CardHeader>
            <CardContent>
              {gameHistory.length > 0 ? (
                <div className="space-y-3">
                  {gameHistory.map((game: any, index: number) => {
                    const isTeam1Player = game.team1Player1.id === playerId || game.team1Player2.id === playerId;
                    const team1Score = isTeam1Player ? game.team1Score : game.team2Score;
                    const team2Score = isTeam1Player ? game.team2Score : game.team1Score;
                    const isWin = team1Score > team2Score;
                    
                    return (
                      <div 
                        key={game.id}
                        className={`p-4 rounded-lg border ${
                          isWin 
                            ? "bg-green-50/50 border-green-200" 
                            : "bg-red-50/50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="px-2 py-1 rounded text-xs font-medium bg-gray-100">
                            {new Date(game.playedAt).toLocaleDateString("de-DE")}
                          </div>
                        </div>
                        <div className="text-center py-2">
                          <div className="inline-flex items-center gap-4 text-lg font-bold">
                            <span className={isWin ? "text-green-600" : ""}>
                              {team1Score}
                            </span>
                            <span className="text-muted-foreground">:</span>
                            <span className={!isWin ? "text-green-600" : ""}>
                              {team2Score}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Noch keine Spiele gespielt</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}