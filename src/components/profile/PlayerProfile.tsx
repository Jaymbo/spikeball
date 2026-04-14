"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, Calendar, History, TrendingUp, UserPlus, UserCheck, Clock, UserMinus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AvatarUpload } from "./AvatarUpload";
import { getCurrentUser } from "@/lib/auth";

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
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestType, setFriendRequestType] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // For friend operations

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
      setIsFriend(data.isFriend || false);
      setFriendRequestType(data.friendRequestType || null);
      setFriendshipId(data.friendshipId || null);
      setIsActuallyOwnProfile(data.isOwnProfile || false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[PlayerProfile] Error fetching data:", err);
      setError(errorMessage);
      toast.error("Profil konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const fetchCurrentUserId = useCallback(async () => {
    // Only fetch currentUserId if needed for friend operations
    try {
      const res = await fetch("/api/players/current-player");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.currentPlayerId);
      }
    } catch (err) {
      console.error("[PlayerProfile] Error fetching current user:", err);
    }
  }, []);

  const handleSendFriendRequest = async () => {
    if (!playerData) return;
    
    setFriendRequestLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: playerData.player.name }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(`Fehler: ${error.error || "Unbekannter Fehler"}`);
        return;
      }

      toast.success("Freundschaftsanfrage gesendet!");
      setFriendRequestType("outgoing");
      // Refresh data to get updated status
      await fetchPlayerData();
    } catch (err) {
      console.error("[PlayerProfile] Error sending friend request:", err);
      toast.error("Fehler beim Senden der Anfrage");
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    // OPTIMIZED: Use stored friendshipId directly
    if (!friendshipId) {
      toast.error(" friendship ID fehlt");
      return;
    }
    
    setFriendRequestLoading(true);
    try {
      const acceptRes = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          friendshipId: friendshipId, 
          action: "accept" 
          }),
      });

      if (acceptRes.ok) {
        toast.success("Freundschaft angenommen!");
        setFriendRequestType("accepted");
        setIsFriend(true);
        await fetchPlayerData();
      } else {
        throw new Error("Annehmen fehlgeschlagen");
      }
    } catch (err) {
      console.error("Error accepting friend request:", err);
      toast.error("Fehler beim Annehmen der Anfrage");
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    // OPTIMIZED: Use stored friendshipId directly
    if (!friendshipId) {
      toast.error("Friendship ID fehlt");
      return;
    }
    
    setFriendRequestLoading(true);
    try {
      const rejectRes = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (rejectRes.ok) {
        toast.success("Anfrage abgelehnt");
        setFriendRequestType(null);
        await fetchPlayerData();
      } else {
        throw new Error("Ablehnen fehlgeschlagen");
      }
    } catch (err) {
      console.error("Error rejecting friend request:", err);
      toast.error("Fehler beim Ablehnen der Anfrage");
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    // OPTIMIZED: Use stored friendshipId directly
    if (!friendshipId) {
      toast.error("Friendship ID fehlt");
      return;
    }
    
    setFriendRequestLoading(true);
    try {
      const cancelRes = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (cancelRes.ok) {
        toast.success("Anfrage zurückgezogen");
        setFriendRequestType(null);
        await fetchPlayerData();
      } else {
        throw new Error("Zurückziehen fehlgeschlagen");
      }
    } catch (err) {
      console.error("Error canceling friend request:", err);
      toast.error("Fehler beim Zurückziehen der Anfrage");
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    // OPTIMIZED: Use stored friendshipId directly
    if (!friendshipId) {
      toast.error("Friendship ID fehlt");
      return;
    }
    
    setFriendRequestLoading(true);
    try {
      const removeRes = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (removeRes.ok) {
        toast.success("Freund entfernt");
        setFriendRequestType(null);
        setIsFriend(false);
        await fetchPlayerData();
      } else {
        throw new Error("Entfernen fehlgeschlagen");
      }
    } catch (err) {
      console.error("Error removing friend:", err);
      toast.error("Fehler beim Entfernen");
    } finally {
      setFriendRequestLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData();
    fetchCurrentUserId(); // Only fetch currentUserId for operations
  }, [fetchPlayerData, fetchCurrentUserId]);

  const handleUploadSuccess = (newPath: string) => {
    if (!playerData) return;
    
    setPlayerData({
      ...playerData,
      player: { ...playerData.player, profilePicture: newPath },
    });
    setUploadDialogOpen(false);
    toast.success("Profilbild erfolgreich hochgeladen");
  };

  // Wenn es das eigene Profil ist, Freundschafts-Button nicht anzeigen
  const showFriendButton = !isActuallyOwnProfile && currentUserId;

  // Freundschafts-Status-Badge
  const getFriendStatusBadge = () => {
    if (isFriend || friendRequestType === "accepted") {
      return (
        <Badge variant="default" className="gap-1 shrink-0">
          <UserCheck className="h-3 w-3" />
          <span>Befreundet</span>
        </Badge>
      );
    }
    if (friendRequestType === "incoming") {
      return (
        <Badge variant="secondary" className="gap-1 shrink-0">
          <UserPlus className="h-3 w-3" />
          <span>Eingehend</span>
        </Badge>
      );
    }
    if (friendRequestType === "outgoing") {
      return (
        <Badge variant="outline" className="gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          <span>Angefragt</span>
        </Badge>
      );
    }
    return null;
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
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {/* Avatar Section */}
            <div className="relative mx-auto sm:mx-0">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
                <AvatarImage src={player.profilePicture || undefined} alt={player.name} />
                <AvatarFallback className="text-2xl sm:text-3xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                  {player.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {(isActuallyOwnProfile || isAdmin) && (
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full p-0 shadow-md"
                    >
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
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

            {/* Name and Info Section */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold">{player.name}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {isActuallyOwnProfile && (
                    <Badge variant="secondary" className="text-xs">
                      Du
                    </Badge>
                  )}
                  {getFriendStatusBadge()}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Seit </span>
                  {new Date(player.createdAt).toLocaleDateString("de-DE")}
                </div>
                {player.lastPlayedAt && (
                  <div className="flex items-center gap-1">
                    <History className="h-4 w-4" />
                    <span className="hidden xs:inline sm:inline">Zuletzt aktiv: </span>
                    {new Date(player.lastPlayedAt).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
            </div>

            {/* ELO and Action Section */}
            <div className="text-center sm:text-right flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 sm:flex-initial">
                <div className="flex items-center justify-center sm:justify-end gap-2 text-sm text-muted-foreground mb-1">
                  <Trophy className="h-4 w-4" />
                  ELO Rating
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-orange-600">
                  {player.eloRating.toFixed(1)}
                </div>
                {(eloHistory.length > 0) && (
                  <div className={`text-xs sm:text-sm font-medium mt-1 flex items-center gap-1 justify-center sm:justify-end ${
                    eloHistory[0].change >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    {eloHistory[0].change >= 0 ? "+" : ""}
                    {eloHistory[0].change.toFixed(1)}
                  </div>
                )}
              </div>
              
              {/* Friend Button - korrigiert fr alle Status-Werte */}
              <div className="flex justify-center sm:justify-end">
                {showFriendButton && (
                  (() => {
                    if (isFriend || friendRequestType === "accepted") {
                      return (
                        <Button
                          onClick={handleRemoveFriend}
                          disabled={friendRequestLoading}
                          size="sm"
                          variant="outline"
                          className="gap-2 w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <UserMinus className="h-4 w-4" />
                          {friendRequestLoading ? "Wird entfernt..." : "Freund entfernen"}
                        </Button>
                      );
                    }
                    if (friendRequestType === "incoming") {
                      return (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAcceptFriendRequest}
                            disabled={friendRequestLoading}
                            size="sm"
                            variant="default"
                            className="gap-2"
                          >
                            <UserCheck className="h-4 w-4" />
                            Annehmen
                          </Button>
                          <Button
                            onClick={handleRejectFriendRequest}
                            disabled={friendRequestLoading}
                            size="sm"
                            variant="outline"
                            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                            Ablehnen
                          </Button>
                        </div>
                      );
                    }
                    if (friendRequestType === "outgoing") {
                      return (
                        <Button
                          onClick={handleCancelFriendRequest}
                          disabled={friendRequestLoading}
                          size="sm"
                          variant="outline"
                          className="gap-2 w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                          {friendRequestLoading ? "Wird abgebrochen..." : "Anfrage zurckziehen"}
                        </Button>
                      );
                    }
                    return (
                      <Button
                        onClick={handleSendFriendRequest}
                        disabled={friendRequestLoading}
                        size="sm"
                        variant="default"
                        className="gap-2 w-full sm:w-auto"
                      >
                        <UserPlus className="h-4 w-4" />
                        {friendRequestLoading ? "Wird gesendet..." : "Freund hinzufgen"}
                      </Button>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-6">
            <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
              <div className="text-xl sm:text-2xl font-bold">{player.gamesPlayed}</div>
              <div className="text-xs text-muted-foreground">Spiele</div>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{player.wins}</div>
              <div className="text-xs text-muted-foreground">Siege</div>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{player.losses}</div>
              <div className="text-xs text-muted-foreground">Niederlagen</div>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{winRate}%</div>
              <div className="text-xs text-muted-foreground">Win-Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="info" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Verlauf</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Profil-Informationen</CardTitle>
              <CardDescription>Basis-Informationen zum Spieler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
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
              <CardTitle className="text-lg sm:text-xl">Spiel-Historie</CardTitle>
              <CardDescription>Die letzten {gameHistory.length} Spiele</CardDescription>
            </CardHeader>
            <CardContent>
              {gameHistory.length > 0 ? (
                <div className="space-y-3">
                  {gameHistory.slice(0, 10).map((game: any) => {
                    const isTeam1Player = game.team1Player1.id === playerId || game.team1Player2.id === playerId;
                    const team1Score = isTeam1Player ? game.team1Score : game.team2Score;
                    const team2Score = isTeam1Player ? game.team2Score : game.team1Score;
                    const isWin = team1Score > team2Score;
                    
                    return (
                      <div 
                        key={game.id}
                        className={`p-3 sm:p-4 rounded-lg border ${
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
                          <div className="inline-flex items-center gap-3 sm:gap-4 text-lg sm:text-xl font-bold">
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
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
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