"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import SearchInput from "@/components/ui/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GameHistoryProps {
  onRefreshTrigger: number;
  onGameDeleted: () => void;
  isAdmin: boolean;
}

interface GameEntry {
  id: string;
  team1Player1: { id: string; name: string; eloRating: number; profilePicture?: string };
  team1Player2: { id: string; name: string; eloRating: number; profilePicture?: string };
  team2Player1: { id: string; name: string; eloRating: number; profilePicture?: string };
  team2Player2: { id: string; name: string; eloRating: number; profilePicture?: string };
  team1Score: number;
  team2Score: number;
  playedAt: string;
  eloChanges: Array<{
    playerId: string;
    previousRating: number;
    newRating: number;
    change: number;
    player?: { name: string };
  }>;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GameHistory({ onRefreshTrigger, onGameDeleted, isAdmin }: GameHistoryProps) {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 20;

  const filteredGames = games.filter(
    (game) =>
      game.team1Player1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.team1Player2.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.team2Player1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.team2Player2.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/games?limit=${pageSize}&offset=${page * pageSize}`);
      if (res.ok) {
        const data = await res.json();
        setGames(data.games);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Error fetching games:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames, onRefreshTrigger]);

  const deleteGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/games?id=${gameId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Spiel wurde rückgängig gemacht");
        setDeleteConfirmId(null);
        fetchGames();
        onGameDeleted();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Löschen");
      }
    } catch {
      toast.error("Netzwerkfehler");
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <History className="h-12 w-12 mb-4 animate-pulse" />
        <p>Lade Spielverlauf...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <History className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Keine Spiele gespielt</p>
        <p className="text-sm mt-1">Trage das erste Spiel ein, um hier den Verlauf zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Refresh */}
      <div className="flex gap-2">
        <SearchInput
          placeholder="Nach Spielernamen suchen..."
          onSearch={setSearchQuery}
          className="flex-1"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={fetchGames}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {total} {total === 1 ? "Spiel" : "Spiele"} insgesamt
        </span>
        <span className="text-sm text-muted-foreground">
          Seite {page + 1} von {totalPages}
        </span>
      </div>

      {/* Game list */}
      <Card>
        <CardContent className="p-0">
          {filteredGames.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? `Keine Ergebnisse für "${searchQuery}"` : "Keine Spiele"}</p>
            </div>
          ) : (
            filteredGames.map((game) => {
              const t1Won = game.team1Score > game.team2Score;
              const isExpanded = expandedId === game.id;

              return (
                <div
                  key={game.id}
                  className="border-b last:border-b-0"
                >
                  {/* Main row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : game.id)}
                  >
                    {/* Winner indicator */}
                    <div className={`shrink-0 w-1.5 h-10 rounded-full ${t1Won ? "bg-emerald-500" : "bg-red-500"}`} />

                    {/* Teams and score */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-6 w-6 border bg-muted text-foreground">
                            <AvatarImage src={game.team1Player1.profilePicture} />
                            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
                              {game.team1Player1.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6 border bg-muted text-foreground">
                            <AvatarImage src={game.team1Player2.profilePicture} />
                            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
                              {game.team1Player2.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`font-medium ${t1Won ? "" : "text-muted-foreground"}`}>
                            {game.team1Player1.name} & {game.team1Player2.name}
                          </span>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs px-1.5">
                          {game.team1Score}:{game.team2Score}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-medium ${!t1Won ? "" : "text-muted-foreground"}`}>
                            {game.team2Player1.name} & {game.team2Player2.name}
                          </span>
                          <Avatar className="h-6 w-6 border bg-muted text-foreground">
                            <AvatarImage src={game.team2Player1.profilePicture} />
                            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none">
                              {game.team2Player1.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6 border bg-muted text-foreground">
                            <AvatarImage src={game.team2Player2.profilePicture} />
                            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none">
                              {game.team2Player2.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(game.playedAt)}
                      </div>
                    </div>

                    {/* Quick ELO changes */}
                    <div className="hidden sm:flex items-center gap-1">
                      {game.eloChanges?.slice(0, 4).map((change, idx) => (
                        <span
                          key={idx}
                          className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                            change.change > 0
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : change.change < 0
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {change.change > 0 ? "+" : ""}{change.change}
                        </span>
                      ))}
                    </div>

                    {/* Expand indicator */}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}

                    {/* Delete - nur für Admins */}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(game.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-0">
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          ELO-Änderungen
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {game.eloChanges?.map((change, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-background rounded-md px-3 py-2"
                            >
                              <span className="text-sm font-medium">
                                {(() => {
                                  const allPlayers = [
                                    game.team1Player1,
                                    game.team1Player2,
                                    game.team2Player1,
                                    game.team2Player2,
                                  ];
                                  const p = allPlayers.find((ap) => ap.id === change.playerId);
                                  return p?.name ?? "?";
                                })()}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(change.previousRating)}
                                </span>
                                {change.change > 0 ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                                ) : change.change < 0 ? (
                                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                ) : (
                                  <Minus className="h-3.5 w-3.5 text-gray-400" />
                                )}
                                <span
                                  className={`font-mono font-bold text-sm ${
                                    change.change > 0
                                      ? "text-green-600"
                                      : change.change < 0
                                      ? "text-red-500"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {change.change > 0 ? "+" : ""}
                                  {change.change}
                                </span>
                                <span className="text-xs font-medium">
                                  {Math.round(change.newRating)}
                                </span>
                              </div>
                            </div>
                        ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Zurück
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} von {total}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Weiter
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spiel rückgängig machen?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Das Spiel wird gelöscht und alle ELO-Änderungen werden rückgängig gemacht.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Abbrechen</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteGame(deleteConfirmId)}
            >
              Rückgängig machen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
