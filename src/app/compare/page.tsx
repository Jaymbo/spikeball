"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EloComparisonChart } from "@/components/profile/EloComparisonChart";
import type { PlayerEloData } from "@/components/profile/types";
import { PlayerAutocomplete } from "@/components/spikeball/PlayerAutocomplete";
import { usePlayers } from "@/hooks/use-players";
import { toast } from "sonner";
import { Users, ArrowRight } from "lucide-react";

export default function ComparePage() {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerEloData[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: players = [] } = usePlayers();

  const addPlayer = async (playerId: string, _playerName: string) => {
    // Check if player already selected
    if (selectedPlayers.some(p => p.playerId === playerId)) {
      toast.error("Dieser Spieler ist bereits ausgewählt");
      return;
    }

    // Check max players
    if (selectedPlayers.length >= 8) {
      toast.error("Maximal 8 Spieler können verglichen werden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/players/${playerId}`);
      if (!res.ok) {
        throw new Error("Fehler beim Laden der Spielerdaten");
      }

      const data = await res.json();
      
      setSelectedPlayers(prev => [...prev, {
        playerId: data.player.id,
        playerName: data.player.name,
        eloHistory: data.eloHistory,
        color: "#3b82f6",
      }]);

      toast.success(`${data.player.name} hinzugefügt`);
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error("Fehler beim Hinzufügen des Spielers");
    } finally {
      setLoading(false);
    }
  };

  const removePlayer = (playerId: string) => {
    setSelectedPlayers(prev => prev.filter(p => p.playerId !== playerId));
  };

  const clearAll = () => {
    setSelectedPlayers([]);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Users className="h-10 w-10" />
            ELO-Vergleich
          </h1>
          <p className="text-muted-foreground text-lg">
            Vergleiche die ELO-Entwicklung mehrerer Spieler
          </p>
        </div>

        {/* Add Player Section */}
        <Card>
          <CardHeader>
            <CardTitle>Spieler hinzufügen</CardTitle>
            <CardDescription>
              Wähle bis zu 8 Spieler zum Vergleichen aus ({selectedPlayers.length}/8)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <PlayerAutocomplete
                  players={players}
                  onSelect={(playerId, playerName) => {
                    addPlayer(playerId, playerName);
                  }}
                  placeholder="Spieler suchen..."
                  disabled={loading}
                />
              </div>
            </div>

            {/* Selected Players */}
            {selectedPlayers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map((player) => (
                  <div
                    key={player.playerId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background"
                  >
                    <span className="font-medium">{player.playerName}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 hover:bg-destructive/10"
                      onClick={() => removePlayer(player.playerId)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                {selectedPlayers.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="ml-auto"
                  >
                    Alle entfernen
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Chart */}
        {selectedPlayers.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                ELO-Verlauf Vergleich
              </CardTitle>
              <CardDescription>
                {selectedPlayers.length === 1 
                  ? "Füge weitere Spieler hinzu, um zu vergleichen"
                  : `Vergleich von ${selectedPlayers.length} Spielern`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EloComparisonChart
                players={selectedPlayers}
                onRemovePlayer={removePlayer}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-muted rounded-full p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Keine Spieler ausgewählt</h3>
              <p className="text-muted-foreground max-w-md">
                Suche nach Spielern und füge sie hinzu, um ihre ELO-Entwicklung zu vergleichen.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}