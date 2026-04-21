"use client";

import { useEffect, useState } from "react";
import { UserMinus, Trophy, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import SearchInput from "@/components/ui/search-input";

interface Friend {
  id: string;
  username: string;
  playerName: string | null;
  playerId: string | null;
  profilePicture?: string;
  createdAt: string;
}

interface FriendListProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export function FriendList({ refreshTrigger, onRefresh }: FriendListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchFriends();
  }, [refreshTrigger]);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/friends/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Freund entfernt");
        setFriends((prev) => prev.filter((f) => f.id !== id));
        onRefresh?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Entfernen");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Fehler beim Entfernen");
    }
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.playerName && friend.playerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Lade...
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Noch keine Freunde</p>
        <p className="text-sm mt-2">Füge Freunde hinzu, um sie hier zu sehen!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="mb-4">
        <SearchInput
          placeholder="Nach Benutzername oder Spielername suchen..."
          onSearch={setSearchQuery}
        />
      </div>

      {/* Refresh Button */}
      {searchQuery === "" && (
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchFriends}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Neuladen
          </Button>
        </div>
      )}

      {filteredFriends.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>Keine Ergebnisse für "{searchQuery}"</p>
        </div>
      ) : (
        filteredFriends.map((friend) => (
          <Card key={friend.id} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <Avatar className="h-12 w-12 shrink-0 border-2 bg-muted text-foreground">
                {friend.profilePicture ? (
                  <AvatarImage src={friend.profilePicture ? `/api/images${friend.profilePicture}` : undefined} />
                ) : (
                  <AvatarFallback className="font-bold bg-gradient-to-br from-pink-500 to-rose-600 text-white border-none">
                    {friend.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{friend.username}</p>
                  <Badge variant="secondary" className="text-xs">
                    Befreundet
                  </Badge>
                </div>
                {friend.playerName && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    <span>{friend.playerName}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Seit {new Date(friend.createdAt).toLocaleDateString("de-DE")}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemove(friend.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}