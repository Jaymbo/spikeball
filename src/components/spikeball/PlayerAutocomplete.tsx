"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlayerAutocompleteProps {
  players: Array<{ id: string; name: string; eloRating: number }>;
  onSelect: (playerId: string, playerName: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface PlayerResult {
  id: string;
  name: string;
  eloRating: number;
}

export function PlayerAutocomplete({ 
  players, 
  onSelect, 
  placeholder = "Spieler suchen...",
  disabled = false
}: PlayerAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter players based on query
  useEffect(() => {
    // Show all available players when query is empty or just starting
    if (query.length === 0) {
      setFilteredPlayers(players);
      return;
    }

    const filtered = players.filter((player) => 
      player.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPlayers(filtered);
  }, [query, players]);

  const handleSelect = (playerId: string, playerName: string) => {
    setQuery(playerName);
    onSelect(playerId, playerName);
    setShowResults(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow clicks to register
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={handleBlur}
          disabled={disabled}
          className={`pl-9 w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            query ? "" : "text-muted-foreground"
          }`}
          placeholder={placeholder}
        />
      </div>
      
      {showResults && filteredPlayers.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-900 border border-input rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          {filteredPlayers.map((player, index) => (
            <button
              key={player.id}
              onClick={() => handleSelect(player.id, player.name)}
              className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 ${
                index < filteredPlayers.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{player.name}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Medal className="h-3 w-3" />
                    ELO: {Math.round(player.eloRating)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {showResults && filteredPlayers.length === 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-background border border-input rounded-md px-4 py-3 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Keine Spieler gefunden</p>
        </div>
      )}
    </div>
  );
}