'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  eloRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  profilePicture?: string | null;
  lastPlayedAt: string | null;
}

interface PlayersTabProps {
  players: Player[];
  onPlayersChange: () => void;
  isAdmin: boolean;
  currentUsername?: string;
}

export default function PlayersTab({ players, onPlayersChange }: PlayersTabProps) {

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alle Spieler ({players.length})</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
