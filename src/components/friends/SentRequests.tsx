"use client";

import { useEffect, useState } from "react";
import { Clock, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import SearchInput from "@/components/ui/search-input";

interface SentRequest {
  id: string;
  username: string;
  playerName: string | null;
  playerId: string | null;
  profilePicture?: string;
  createdAt: string;
}

interface SentRequestsProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export function SentRequests({ refreshTrigger, onRefresh }: SentRequestsProps) {
  const [requests, setRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [refreshTrigger]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/friends/sent");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching sent friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/friends/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Anfrage abgebrochen");
        setRequests((prev) => prev.filter((r) => r.id !== id));
        onRefresh?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Abbrechen");
      }
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast.error("Fehler beim Abbrechen");
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.playerName && req.playerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Lade...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Keine ausstehenden Anfragen</p>
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
            onClick={fetchRequests}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Neuladen
          </Button>
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>Keine Ergebnisse für "{searchQuery}"</p>
        </div>
      ) : (
        filteredRequests.map((request) => (
          <Card key={request.id} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <Avatar className="h-12 w-12 shrink-0 border-2 bg-muted text-foreground">
                {request.profilePicture ? (
                  <AvatarImage src={request.profilePicture} />
                ) : (
                  <AvatarFallback className="font-bold bg-gradient-to-br from-violet-500 to-purple-600 text-white border-none">
                    {request.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{request.username}</p>
                  <Badge variant="secondary" className="text-xs">
                    Ausstehend
                  </Badge>
                </div>
                {request.playerName && (
                  <p className="text-sm text-muted-foreground">
                    Spieler: {request.playerName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Gesendet am {new Date(request.createdAt).toLocaleDateString("de-DE")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancel(request.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}