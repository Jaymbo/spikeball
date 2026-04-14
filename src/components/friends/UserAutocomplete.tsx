"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Clock, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserAutocompleteProps {
  onSelect: (userId: string, username: string) => void;
  onBlur?: () => void;
}

interface SearchResult {
  id: string;
  username: string;
  playerName: string | null;
  playerId: string | null;
  friendshipStatus: "pending" | "accepted" | null;
}

const getFriendshipBadge = (status: string | null) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <Clock className="h-3 w-3" />
          Ausstehende Anfrage
        </Badge>
      );
    case "accepted":
      return (
        <Badge variant="default" className="text-xs gap-1">
          <UserCheck className="h-3 w-3" />
          Bereits befreundet
        </Badge>
      );
    default:
      return null;
  }
};

export function UserAutocomplete({ onSelect, onBlur }: UserAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (userId: string, username: string) => {
    setQuery(username);
    onSelect(userId, username);
    setShowResults(false);
    if (onBlur) onBlur();
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow clicks to register
    setTimeout(() => {
      setShowResults(false);
      if (onBlur) onBlur();
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
            setShowResults(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          onBlur={handleBlur}
          className="pl-9 w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Benutzername suchen..."
        />
      </div>
      
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => result.friendshipStatus ? null : handleSelect(result.id, result.username)}
              disabled={!!result.friendshipStatus}
              className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 ${
                result.friendshipStatus ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{result.username}</span>
                  {result.playerName && (
                    <span className="text-sm text-muted-foreground">{result.playerName}</span>
                  )}
                </div>
                {getFriendshipBadge(result.friendshipStatus)}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {loading && showResults && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            Suchen...
          </div>
        </div>
      )}
      
      {showResults && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md px-4 py-3">
          <p className="text-sm text-muted-foreground">Keine Ergebnisse gefunden</p>
        </div>
      )}
    </div>
  );
}