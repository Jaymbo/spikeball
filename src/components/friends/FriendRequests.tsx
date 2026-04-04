"use client";

import { useEffect, useState } from "react";
import { UserCheck, UserX, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface FriendRequest {
  id: string;
  username: string;
  playerName: string | null;
  playerId: string | null;
  createdAt: string;
}

interface FriendRequestsProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export function FriendRequests({ refreshTrigger, onRefresh }: FriendRequestsProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [refreshTrigger]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/friends/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch(`/api/friends/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (res.ok) {
        toast.success("Freundschaft akzeptiert!");
        setRequests((prev) => prev.filter((r) => r.id !== id));
        onRefresh?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Akzeptieren");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Fehler beim Akzeptieren");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/friends/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Anfrage abgelehnt");
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Ablehnen");
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Fehler beim Ablehnen");
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Wird geladen...
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
      {requests.map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex items-center justify-between gap-4">
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
      ))}
    </div>
  );
}