"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, Calendar, History, TrendingUp, TrendingDown, UserPlus, UserCheck, Clock, UserMinus, X, Settings, LineChart, ArrowRight, Users, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AvatarUpload } from "./AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { ProfileSettingsDialog } from "./ProfileSettingsDialog";
import { EloComparisonChart } from "./EloComparisonChart";
import { EloHistoryChart } from "./EloHistoryChart";
import { getCurrentUser } from "@/lib/auth";
import { useInvalidateFriends } from "@/hooks/use-friends";

interface PlayerProfileProps {
  playerId: string;
  isOwnProfile?: boolean;
  isAdmin?: boolean;
  onClose?: () => void;
}

interface PlayerEloData {
  playerId: string;
  playerName: string;
  eloHistory: any[];
  color: string;
}

export function PlayerProfile({ playerId, isOwnProfile = false, isAdmin = false, onClose }: PlayerProfileProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<any>(null);
  
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isActuallyOwnProfile, setIsActuallyOwnProfile] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestType, setFriendRequestType] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // For friend operations
  const invalidateFriends = useInvalidateFriends();

  // Comparison state
  const [comparePlayers, setComparePlayers] = useState<PlayerEloData[]>([]);
  const [compareSearchQuery, setCompareSearchQuery] = useState("");
  const [compareLoading, setCompareLoading] = useState(false);
  const [showCompareSearch, setShowCompareSearch] = useState(false);
  const [compareSearchResults, setCompareSearchResults] = useState<Array<{id: string; name: string; eloRating: number}>>([]);

  const COMPARE_COLORS = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#ef4444", // red
    "#8b5cf6", // purple
    "#eab308", // yellow
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ];

  // Build full comparison data (profile player + added players)
  const allComparePlayers: PlayerEloData[] = [
    {
      playerId: playerId,
      playerName: playerData?.player?.name || "",
      eloHistory: playerData?.eloHistory || [],
      color: "#f97316",
    },
    ...comparePlayers,
  ];

  const addComparePlayer = async (pId: string, pName: string) => {
    if (pId === playerId) {
      toast.error("Das ist der Spieler dieses Profils");
      return;
    }
    if (comparePlayers.some(p => p.playerId === pId)) {
      toast.error("Spieler bereits im Vergleich");
      return;
    }
    if (comparePlayers.length >= 7) {
      toast.error("Maximal 7 weitere Spieler im Vergleich");
      return;
    }

    setCompareLoading(true);
    try {
      const res = await fetch(`/api/players/${pId}`);
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      
      setComparePlayers(prev => [...prev, {
        playerId: data.player.id,
        playerName: data.player.name,
        eloHistory: data.eloHistory,
        color: COMPARE_COLORS[prev.length % COMPARE_COLORS.length],
      }]);
      
      setCompareSearchQuery("");
      setCompareSearchResults([]);
      setShowCompareSearch(false);
      toast.success(`${data.player.name} zum Vergleich hinzugefügt`);
    } catch (error) {
      toast.error("Fehler beim Hinzufügen des Spielers");
    } finally {
      setCompareLoading(false);
    }
  };

  const removeComparePlayer = (pid: string) => {
    setComparePlayers(prev => prev.filter(p => p.playerId !== pid));
  };

  const searchComparePlayers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCompareSearchResults([]);
      return;
    }
    try {
      const res = await fetch("/api/players");
      if (!res.ok) return;
      const allPlayers = await res.json();
      const filtered = allPlayers
        .filter((p: any) => 
          p.name.toLowerCase().includes(query.toLowerCase()) && 
          p.id !== playerId &&
          !comparePlayers.some(cp => cp.playerId === p.id)
        )
        .slice(0, 8);
      setCompareSearchResults(filtered);
    } catch (err) {
      console.error("Error searching players:", err);
    }
  }, [playerId, comparePlayers]);

  const fetchPlayerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // console.log("[PlayerProfile] Fetching data for playerId:", playerId);
      const res = await fetch(`/api/players/${playerId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      // console.log("[PlayerProfile] Received data:", data);
      
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
      invalidateFriends();
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
        invalidateFriends();
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
        invalidateFriends();
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
        invalidateFriends();
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
        invalidateFriends();
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

  

  const handleNameChange = (newName: string) => {
    if (!playerData) return;
    
    setPlayerData({
      ...playerData,
      player: { ...playerData.player, name: newName },
    });
  };

  const handleProfilePictureChange = (newPath: string) => {
    if (!playerData) return;
    
    setPlayerData({
      ...playerData,
      player: { ...playerData.player, profilePicture: newPath },
    });
  };

  const handleUploadSuccess = (newPath: string) => {
    if (!playerData) return;
    
    setPlayerData({
      ...playerData,
      player: { ...playerData.player, profilePicture: newPath },
    });
    setUploadDialogOpen(false);
    toast.success("Profilbild erfolgreich hochgeladen");
    fetchPlayerData();
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

  // Berechne Trend basierend auf letzten 5 Spielen (statt nur letztem Spiel)
  const trend = (() => {
    if (!eloHistory || eloHistory.length === 0) return { change: 0, isPositive: true, gamesCount: 0 };
    
    // Nimm letzte 5 Spiele
    const recentGames = eloHistory.slice(0, Math.min(5, eloHistory.length));
    
    // Berechne durchschnittliche ELO-Änderung
    const totalChange = recentGames.reduce((sum: number, e: any) => sum + (e.change || 0), 0);
    const avgChange = totalChange / recentGames.length;
    
    // Bestimme Trend-Richtung basierend auf Durchschnitt
    const isPositive = avgChange >= 0;
    
    // Zeige Gesamtänderung der letzten 5 Spiele
    return { 
      change: totalChange, 
      isPositive,
      gamesCount: recentGames.length,
      avgChange 
    };
  })();

  // DEBUG: Log all friendship status values being used for rendering
  // console.log("[PlayerProfile rendering] State values:", {
  //   player: player.name,
  //   isActuallyOwnProfile,
  //   isFriend,
  //   friendRequestType,
  //   friendshipId,
  //   currentUserId,
  //   showFriendButton,
  // });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {/* Avatar Section */}
            <div className="relative mx-auto sm:mx-0">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
                <AvatarImage src={player.profilePicture ? `/api/images${player.profilePicture}` : undefined} alt={player.name} />
                <AvatarFallback className="text-2xl sm:text-3xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                  {player.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {(isActuallyOwnProfile || isAdmin) && (
                <div className="flex gap-2">
                  {isActuallyOwnProfile && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full p-0 shadow-md bg-white text-gray-700 hover:bg-gray-100"
                      onClick={() => setSettingsDialogOpen(true)}
                    >
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                  
                  {isAdmin && !isActuallyOwnProfile && (
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
                    trend.isPositive ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {trend.isPositive ? (
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                    <span className="flex items-center gap-1">
                      {trend.change >= 0 ? "+" : ""}{Number(trend.change).toFixed(1)}
                      {trend.gamesCount > 1 && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          ({trend.gamesCount} Spiele)
                        </span>
                      )}
                    </span>
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
                          {friendRequestLoading ? "Wird abgebrochen..." : "Anfrage zurückziehen"}
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
                        {friendRequestLoading ? "Wird gesendet..." : "Freund hinzufügen"}
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
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="info" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="elo" className="gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">ELO-Verlauf</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Spiele</span>
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

        <TabsContent value="elo" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                ELO-Verlauf
              </CardTitle>
              <CardDescription>Entwicklung der ELO-Bewertung über die Zeit</CardDescription>
            </CardHeader>
            <CardContent>
              <EloHistoryChart 
                eloHistory={eloHistory} 
                playerName={player.name}
                color="#f97316"
              />
            </CardContent>
          </Card>

          {/* ELO Comparison Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                ELO-Vergleich
              </CardTitle>
              <CardDescription>
                Vergleiche den ELO-Verlauf mit anderen Spielern ({comparePlayers.length}/7 hinzugefügt)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add player search */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Spieler suchen zum Vergleichen..."
                      value={compareSearchQuery}
                      onChange={(e) => {
                        setCompareSearchQuery(e.target.value);
                        searchComparePlayers(e.target.value);
                        setShowCompareSearch(true);
                      }}
                      onFocus={() => setShowCompareSearch(true)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Search results dropdown */}
                {showCompareSearch && compareSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {compareSearchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addComparePlayer(p.id, p.name)}
                        className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 border-b border-border last:border-0"
                        disabled={compareLoading}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-sm text-muted-foreground">ELO: {Math.round(p.eloRating)}</span>
                        </div>
                        <Plus className="h-4 w-4 ml-auto text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected comparison players */}
              {comparePlayers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {comparePlayers.map((p) => (
                    <div
                      key={p.playerId}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-sm font-medium">{p.playerName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 hover:bg-destructive/10"
                        onClick={() => removeComparePlayer(p.playerId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setComparePlayers([]); setCompareSearchResults([]); }}
                    className="ml-auto text-xs"
                  >
                    Alle entfernen
                  </Button>
                </div>
              )}

              {/* Comparison chart */}
              {comparePlayers.length > 0 ? (
                <EloComparisonChart
                  players={allComparePlayers}
                  onRemovePlayer={removeComparePlayer}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">Suche Spieler, um ihre ELO-Verläufe zu vergleichen</p>
                </div>
              )}
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
                    const isDraw = team1Score === team2Score;
                    
                    // Finde ELO-Change für diesen Spieler in diesem Spiel
                    const playerEloChange = eloHistory.find(
                      (e: any) => e.game?.id === game.id
                    );
                    const eloChange = playerEloChange?.change || 0;
                    
                    return (
                      <div 
                        key={game.id}
                        className={`p-3 sm:p-4 rounded-lg border ${
                          isWin 
                            ? "bg-emerald-50/30 border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-900/50" 
                            : isDraw
                            ? "bg-gray-50/30 border-gray-200/50 dark:bg-gray-950/20 dark:border-gray-800/50"
                            : "bg-rose-50/30 border-rose-200/50 dark:bg-rose-950/20 dark:border-rose-900/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              isWin 
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                                : isDraw
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400"
                            }`}>
                              {isWin ? "Sieg" : isDraw ? "Unentschieden" : "Niederlage"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(game.playedAt).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                          {eloChange !== 0 && (
                            <div className={`flex items-center gap-1 text-xs font-bold ${
                              eloChange > 0 
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}>
                              {eloChange > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {eloChange > 0 ? "+" : ""}{eloChange.toFixed(1)} ELO
                            </div>
                          )}
                        </div>
                        <div className="text-center py-2">
                          <div className="inline-flex items-center gap-3 sm:gap-4 text-lg sm:text-xl font-bold">
                            <span className={`${
                              isWin 
                                ? "text-emerald-600 dark:text-emerald-400" 
                                : isDraw
                                ? "text-gray-600 dark:text-gray-400"
                                : "text-muted-foreground"
                            }`}>
                              {team1Score}
                            </span>
                            <span className="text-muted-foreground">:</span>
                            <span className={`${
                              !isWin && !isDraw
                                ? "text-emerald-600 dark:text-emerald-400" 
                                : isDraw
                                ? "text-gray-600 dark:text-gray-400"
                                : "text-muted-foreground"
                            }`}>
                              {team2Score}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {game.team1Player1.name} {game.team1Player1.id === playerId ? "(Du)" : ""}
                              {game.team1Player1.id === playerId && ` - ${game.team1Player1.eloRating} ELO`}
                            </span>
                            <span>&</span>
                            <span>
                              {game.team1Player2.name} {game.team1Player2.id === playerId ? "(Du)" : ""}
                              {game.team1Player2.id === playerId && ` - ${game.team1Player2.eloRating} ELO`}
                            </span>
                            <span className="text-muted-foreground/50">vs</span>
                            <span>
                              {game.team2Player1.name} {game.team2Player1.id === playerId ? "(Du)" : ""}
                              {game.team2Player1.id === playerId && ` - ${game.team2Player1.eloRating} ELO`}
                            </span>
                            <span>&</span>
                            <span>
                              {game.team2Player2.name} {game.team2Player2.id === playerId ? "(Du)" : ""}
                              {game.team2Player2.id === playerId && ` - ${game.team2Player2.eloRating} ELO`}
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
      
      {isActuallyOwnProfile && (
        <ProfileSettingsDialog
          open={settingsDialogOpen}
          playerId={playerId}
          currentName={player.name}
          currentProfilePicture={player.profilePicture}
          onNameChange={handleNameChange}
          onProfilePictureChange={handleProfilePictureChange}
          onOpenChange={setSettingsDialogOpen}
        />
      )}
      
      {isAdmin && !isActuallyOwnProfile && (
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
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
  );
}