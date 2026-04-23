"use client";

import { useState } from "react";
import {
  Swords,
  Users,
  ArrowRight,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PlayerAutocomplete } from "./PlayerAutocomplete";

interface Player {
  id: string;
  name: string;
  eloRating: number;
}

interface RecordGameProps {
  players: Player[];
  onGameRecorded: () => void;
}

export default function RecordGame({ players, onGameRecorded }: RecordGameProps) {
  const [team1Player1Id, setTeam1Player1Id] = useState("");
  const [team1Player2Id, setTeam1Player2Id] = useState("");
  const [team2Player1Id, setTeam2Player1Id] = useState("");
  const [team2Player2Id, setTeam2Player2Id] = useState("");
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  
  // Display names for selected players
  const [team1Player1Name, setTeam1Player1Name] = useState("");
  const [team1Player2Name, setTeam1Player2Name] = useState("");
  const [team2Player1Name, setTeam2Player1Name] = useState("");
  const [team2Player2Name, setTeam2Player2Name] = useState("");

  const availableForSlot = (slot: string): Player[] => {
    const taken = new Set<string>();
    if (team1Player1Id && slot !== "t1p1") taken.add(team1Player1Id);
    if (team1Player2Id && slot !== "t1p2") taken.add(team1Player2Id);
    if (team2Player1Id && slot !== "t2p1") taken.add(team2Player1Id);
    if (team2Player2Id && slot !== "t2p2") taken.add(team2Player2Id);
    return players.filter((p) => !taken.has(p.id));
  };

  const handlePlayerSelect = (slot: string, playerId: string, playerName: string) => {
    switch (slot) {
      case "t1p1":
        setTeam1Player1Id(playerId);
        setTeam1Player1Name(playerName);
        break;
      case "t1p2":
        setTeam1Player2Id(playerId);
        setTeam1Player2Name(playerName);
        break;
      case "t2p1":
        setTeam2Player1Id(playerId);
        setTeam2Player1Name(playerName);
        break;
      case "t2p2":
        setTeam2Player2Id(playerId);
        setTeam2Player2Name(playerName);
        break;
    }
  };

  const isValid =
    team1Player1Id &&
    team1Player2Id &&
    team2Player1Id &&
    team2Player2Id &&
    team1Score !== "" &&
    team2Score !== "" &&
    parseInt(team1Score) >= 0 &&
    parseInt(team2Score) >= 0 &&
    parseInt(team1Score) !== parseInt(team2Score);

  const resetForm = () => {
    setTeam1Player1Id("");
    setTeam1Player2Id("");
    setTeam2Player1Id("");
    setTeam2Player2Id("");
    setTeam1Score("");
    setTeam2Score("");
    setTeam1Player1Name("");
    setTeam1Player2Name("");
    setTeam2Player1Name("");
    setTeam2Player2Name("");
  };

  const submitGame = async () => {
    if (!isValid) return;

    // Validate all players are different
    const ids = [team1Player1Id, team1Player2Id, team2Player1Id, team2Player2Id];
    if (new Set(ids).size !== 4) {
      toast.error("Alle Spieler müssen unterschiedlich sein!");
      return;
    }

    const t1Score = parseInt(team1Score);
    const t2Score = parseInt(team2Score);

    if (t1Score === t2Score) {
      toast.error("Unentschieden ist bei Spikeball nicht möglich!");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1Player1Id,
          team1Player2Id,
          team2Player1Id,
          team2Player2Id,
          team1Score: t1Score,
          team2Score: t2Score,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Spiel wurde eingetragen!");
        setRecentGames((prev) => [data, ...prev.slice(0, 4)]);
        resetForm();
        onGameRecorded();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Eintragen");
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/games?id=${gameId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Spiel wurde gelöscht");
        setRecentGames((prev) => prev.filter((g) => g.id !== gameId));
        setDeleteConfirmId(null);
        onGameRecorded();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Löschen");
      }
    } catch {
      toast.error("Netzwerkfehler");
    }
  };

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name ?? "?";

  const getEloChangeForPlayer = (game: any, playerId: string) => {
    const change = game.eloChanges?.find((c: any) => c.playerId === playerId);
    return change;
  };

  if (players.length < 4) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Swords className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Nicht genug Spieler</p>
          <p className="text-sm mt-1">Du brauchst mindestens 4 Spieler um ein Spiel einzutragen.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Swords className="h-5 w-5" />
            Neues Spiel eintragen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-start">
            {/* Team 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">
                  Team 1
                </Badge>
                {team1Score && (
                  <span className="text-2xl font-black text-emerald-600">{team1Score}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Spieler 1</Label>
                <PlayerAutocomplete 
                  players={availableForSlot("t1p1")}
                  onSelect={(id, name) => handlePlayerSelect("t1p1", id, name)}
                  placeholder={team1Player1Name || "Spieler suchen..."}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Spieler 2</Label>
                <PlayerAutocomplete 
                  players={availableForSlot("t1p2")}
                  onSelect={(id, name) => handlePlayerSelect("t1p2", id, name)}
                  placeholder={team1Player2Name || "Spieler suchen..."}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Punkte</Label>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  placeholder="0"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>

            {/* VS */}
            <div className="hidden md:flex items-center justify-center pt-8">
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
                <span className="text-xs font-bold text-muted-foreground">VS</span>
              </div>
            </div>
            <div className="flex md:hidden items-center justify-center">
              <span className="text-xs font-bold text-muted-foreground px-4 py-1 bg-muted rounded-full">
                VS
              </span>
            </div>

            {/* Team 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20">
                  Team 2
                </Badge>
                {team2Score && (
                  <span className="text-2xl font-black text-red-600">{team2Score}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Spieler 1</Label>
                <PlayerAutocomplete 
                  players={availableForSlot("t2p1")}
                  onSelect={(id, name) => handlePlayerSelect("t2p1", id, name)}
                  placeholder={team2Player1Name || "Spieler suchen..."}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Spieler 2</Label>
                <PlayerAutocomplete 
                  players={availableForSlot("t2p2")}
                  onSelect={(id, name) => handlePlayerSelect("t2p2", id, name)}
                  placeholder={team2Player2Name || "Spieler suchen..."}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Punkte</Label>
                <Input
                  type="number"
                  min="0"
                  max="99"
                  placeholder="0"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={resetForm}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
            <Button onClick={submitGame} disabled={!isValid || isSubmitting}>
              <Swords className="h-4 w-4 mr-2" />
              {isSubmitting ? "Wird eingetragen..." : "Spiel eintragen"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Games from this session */}
      {recentGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gerade eingetragen</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentGames.map((game) => {
              const t1Won = game.team1Score > game.team2Score;
              return (
                <div
                  key={game.id}
                  className="flex items-center gap-4 px-6 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${t1Won ? "text-green-600" : ""}`}>
                        {getPlayerName(game.team1Player1Id)} & {getPlayerName(game.team1Player2Id)}
                      </span>
                      <span className="text-sm font-bold">{game.team1Score}</span>
                      <span className="text-muted-foreground">:</span>
                      <span className="text-sm font-bold">{game.team2Score}</span>
                      <span className={`font-medium ${!t1Won ? "text-green-600" : ""}`}>
                        {getPlayerName(game.team2Player1Id)} & {getPlayerName(game.team2Player2Id)}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {[game.team1Player1Id, game.team1Player2Id, game.team2Player1Id, game.team2Player2Id].map(
                        (pid) => {
                          const change = getEloChangeForPlayer(game, pid);
                          if (!change) return null;
                          return (
                            <span
                              key={pid}
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                change.change > 0
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : change.change < 0
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                              }`}
                            >
                              {getPlayerName(pid)}: {change.change > 0 ? "+" : ""}
                              {change.change}
                            </span>
                          );
                        },
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setDeleteConfirmId(game.id)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
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
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
