"use client";

import { useEffect, useState } from "react";
import { UserMinus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Friend {
  id: string;
  username: string;
  playerName: string | null;
  playerId: string | null;
  createdAt: string;
}

interface FriendListProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export function FriendList({ refreshTrigger, onRefresh }: FriendListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Wird geladen...
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Noch keine Freunde</p>
        <p className="text-sm mt-2">Füge Freunde hinzu, um sie hier zu sehen!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friend) => (
        <Card key={friend.id} className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium">{friend.username}</p>
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
      ))}
    </div>
  );
}