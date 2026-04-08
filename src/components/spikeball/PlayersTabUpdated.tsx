'use client';

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, UserPlus, Check, X, Pencil, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import SearchInput from "@/components/ui/search-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlayerProfile } from "@/components/profile/PlayerProfile";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

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

export default function PlayersTab({ players, onPlayersChange, isAdmin, currentUsername }: PlayersTabProps) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);

  const handleViewProfile = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setProfileDialogOpen(true);
  };

  const handleViewImage = (imageUrl: string | null | undefined) => {
    if (imageUrl) {
      setImageViewerOpen(true);
    }
  };

  const handleUploadOpen = (playerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarUploadOpen(true);
  };

  const handleUploadSuccess = (path: string) => {
    setAvatarUploadOpen(false);
    onPlayersChange();
    toast.success("Profilbild erfolgreich hochgeladen!");
  };

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
