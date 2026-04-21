"use client";

import { useEffect, useState } from "react";
import { UserCheck, UserX, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import SearchInput from "@/components/ui/search-input";
import { useFriendRequestMutation } from "@/hooks/use-friends";

interface FriendRequest {
  id: string;
  username: string;
  playerName: string | null;
  playerId: string | null;
  profilePicture?: string;
  createdAt: string;
}

interface FriendRequestsProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
  onPendingCountChange?: (count: number) => void;
}

export function FriendRequests({ refreshTrigger, onRefresh, onPendingCountChange }: FriendRequestsProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const friendRequestMutation = useFriendRequestMutation();

  useEffect(() => {
    fetchRequests();
  }, [refreshTrigger]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/friends/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
        onPendingCountChange?.(data.length);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await friendRequestMutation.mutateAsync({ action: 'accept', requestId: id });
      toast.success("Freundschaft akzeptiert!");
      const updated = requests.filter((r) => r.id !== id);
      setRequests(updated);
      onPendingCountChange?.(updated.length);
      onRefresh?.();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Fehler beim Akzeptieren");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await friendRequestMutation.mutateAsync({ action: 'reject', requestId: id });
      toast.success("Anfrage abgelehnt");
      const updated = requests.filter((r) => r.id !== id);
      setRequests(updated);
      onPendingCountChange?.(updated.length);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Fehler beim Ablehnen");
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
                  <AvatarImage src={request.profilePicture ? `/api/images${request.profilePicture}` : undefined} />
                ) : (
                  <AvatarFallback className="font-bold bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-none">
                    {request.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{request.username}</p>
                {request.playerName && (
                  <p className="text-sm text-muted-foreground">
                    Spieler: {request.playerName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(request.createdAt).toLocaleDateString("de-DE")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id)}
                >
                  <UserX className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(request.id)}
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}