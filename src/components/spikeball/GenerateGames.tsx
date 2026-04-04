"use client";

import { useState } from "react";
import {
  Shuffle,
  Users,
  Zap,
  ArrowRight,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  eloRating: number;
}

interface GenerateGamesProps {
  players: Player[];
}

interface Matchup {
  team1: {
    player1: { id: string; name: string; eloRating: number };
    player2: { id: string; name: string; eloRating: number };
  };
  team2: {
    player1: { id: string; name: string; eloRating: number };
    player2: { id: string; name: string; eloRating: number };
  };
  balanceScore: number;
  team1Avg: number;
  team2Avg: number;
}

export default function GenerateGames({ players }: GenerateGamesProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const togglePlayer = (id: string) => {
    const newSet = new Set(selectedPlayerIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPlayerIds(newSet);
    // Clear matchups when selection changes
    setMatchups([]);
  };

  const selectAll = () => {
    setSelectedPlayerIds(new Set(players.map((p) => p.id)));
    setMatchups([]);
  };

  const selectNone = () => {
    setSelectedPlayerIds(new Set());
    setMatchups([]);
  };

  const generate = async () => {
    if (selectedPlayerIds.size < 4) {
      toast.error("Wähle mindestens 4 Spieler aus!");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/generate-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: Array.from(selectedPlayerIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        setMatchups(data.matchups);
        setShowAll(false);
        if (data.matchups.length === 0) {
          toast.error("Konnte keine Matchups generieren");
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler bei der Generierung");
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setIsGenerating(false);
    }
  };

  const displayMatchups = showAll ? matchups : matchups.slice(0, 3);

  const getBalanceColor = (score: number): string => {
    if (score < 20) return "text-green-600";
    if (score < 50) return "text-yellow-600";
    if (score < 100) return "text-orange-600";
    return "text-red-600";
  };

  const getBalanceLabel = (score: number): string => {
    if (score < 20) return "Perfekt balanciert";
    if (score < 50) return "Gut balanciert";
    if (score < 100) return "Ausgewogen";
    return "Unbalanciert";
  };

  return (
    <div className="space-y-6">
      {/* Player Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Wer spielt heute?
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Alle
              </Button>
              <Button variant="ghost" size="sm" onClick={selectNone}>
                Keine
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {players.length < 4 ? (
            <p className="text-muted-foreground text-sm">
              Du brauchst mindestens 4 Spieler, um Spiele zu generieren.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {players.map((player) => (
                <label
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPlayerIds.has(player.id)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedPlayerIds.has(player.id)}
                    onCheckedChange={() => togglePlayer(player.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ELO: {Math.round(player.eloRating)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              {selectedPlayerIds.size} Spieler ausgewählt
              {selectedPlayerIds.size > 0 && selectedPlayerIds.size < 4 && (
                <span className="text-destructive ml-1">(mindestens 4 benötigt)</span>
              )}
            </span>
            <Button
              onClick={generate}
              disabled={selectedPlayerIds.size < 4 || isGenerating}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              {isGenerating ? "Generiere..." : "Matchups generieren"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Matchups */}
      {matchups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              Empfohlene Matchups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayMatchups.map((matchup, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  index === 0
                    ? "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant={index === 0 ? "default" : "outline"}
                    className={index === 0 ? "bg-green-600" : ""}
                  >
                    {index === 0 ? "Beste Option" : `Option ${index + 1}`}
                  </Badge>
                  <span className={`text-sm font-medium ${getBalanceColor(matchup.balanceScore)}`}>
                    {getBalanceLabel(matchup.balanceScore)}
                    <span className="ml-1 text-xs opacity-75">
                      (Diff: {Math.round(matchup.balanceScore)})
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Team 1 */}
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Team 1 (Ø {matchup.team1Avg})
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-md px-3 py-1.5 flex-1 text-center">
                        <div className="font-medium text-sm">{matchup.team1.player1.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(matchup.team1.player1.eloRating)}
                        </div>
                      </div>
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-md px-3 py-1.5 flex-1 text-center">
                        <div className="font-medium text-sm">{matchup.team1.player2.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(matchup.team1.player2.eloRating)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center">
                    <Swords className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Team 2 */}
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                      Team 2 (Ø {matchup.team2Avg})
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-red-100 dark:bg-red-900/30 rounded-md px-3 py-1.5 flex-1 text-center">
                        <div className="font-medium text-sm">{matchup.team2.player1.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(matchup.team2.player1.eloRating)}
                        </div>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/30 rounded-md px-3 py-1.5 flex-1 text-center">
                        <div className="font-medium text-sm">{matchup.team2.player2.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(matchup.team2.player2.eloRating)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {matchups.length > 3 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Weniger anzeigen" : `Alle ${matchups.length} Matchups anzeigen`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
