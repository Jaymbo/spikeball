"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, UserPlus, Check, X, Pencil, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Player {
  id: string;
  name: string;
  eloRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
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
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [resetLoadingId, setResetLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addPlayer = async () => {
    if (!isAdmin) {
      toast.error("Nur Admins können Spieler hinzufügen");
      return;
    }

    if (!newPlayerName.trim()) return;

    try {
      setIsAdding(true);
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `"${newPlayerName.trim()}" wurde hinzugefügt!`);
        setNewPlayerName("");
        onPlayersChange();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Hinzufügen");
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setIsAdding(false);
    }
  };

  const deletePlayer = async (id: string, name: string) => {
    if (!isAdmin) {
      toast.error("Nur Admins können Spieler löschen");
      return;
    }

    try {
      const res = await fetch(`/api/players?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`"${name}" wurde gelöscht`);
        setDeleteConfirmId(null);
        onPlayersChange();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Löschen");
      }
    } catch {
      toast.error("Netzwerkfehler");
    }
  };

  const renamePlayer = async () => {
    if (!editPlayerId || !editPlayerName.trim()) return;

    try {
      setIsRenaming(true);
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editPlayerId, name: editPlayerName.trim() }),
      });

      if (res.ok) {
        toast.success("Spielername wurde geändert");
        setEditPlayerId(null);
        setEditPlayerName("");
        onPlayersChange();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Umbenennen");
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setIsRenaming(false);
    }
  };

  const resetPlayerPassword = async (id: string, name: string) => {
    if (!isAdmin) return;

    try {
      setResetLoadingId(id);
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resetPassword: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Fehler beim Passwort-Reset");
        return;
      }

      const tempPassword = data.temporaryPassword;
      toast.success(`Neues Passwort für ${name}: ${tempPassword}`);

      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(tempPassword);
          toast.success("Temporäres Passwort wurde in die Zwischenablage kopiert");
        } catch {
          // ignore clipboard errors
        }
      }
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setResetLoadingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addPlayer();
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Player Card */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" />
              Spieler hinzufügen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Neue Accounts erhalten das Standardpasswort <strong>12345678</strong> und müssen es beim ersten Login ändern.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Name des Spielers..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={addPlayer} disabled={!newPlayerName.trim() || isAdding}>
                <Plus className="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Players List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              Alle Spieler
              <span className="text-sm font-normal text-muted-foreground">
                ({players.length})
              </span>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={onPlayersChange}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Neuladen
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search Input */}
          <div className="p-4 border-b">
            <SearchInput
              placeholder="Nach Spielername suchen..."
              onSearch={setSearchQuery}
            />
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? `Keine Ergebnisse für "${searchQuery}"` : "Noch keine Spieler vorhanden"}</p>
              <p className="text-sm mt-1">{searchQuery ? "Versuche einen anderen Suchbegriff." : "Füge oben einen neuen Spieler hinzu."}</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {filteredPlayers.map((player, index) => (
                (() => {
                  const canEdit = isAdmin || (currentUsername && currentUsername === player.name);

                  return (
                <div
                  key={player.id}
                  className="flex items-center gap-4 px-6 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 text-center font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{player.name}</span>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span>ELO: {Math.round(player.eloRating)}</span>
                      <span>{player.gamesPlayed} Spiele</span>
                      <span className="text-green-600">{player.wins}W</span>
                      <span className="text-red-500">{player.losses}L</span>
                    </div>
                  </div>
                  {canEdit && (
                  <Dialog
                    open={editPlayerId === player.id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditPlayerId(null);
                        setEditPlayerName("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => {
                          setEditPlayerId(player.id);
                          setEditPlayerName(player.name);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Spielername bearbeiten</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Neuer Name für <strong>{player.name}</strong>
                        </p>
                        <Input
                          value={editPlayerName}
                          onChange={(e) => setEditPlayerName(e.target.value)}
                          placeholder="Neuer Spielername"
                          autoFocus
                        />
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="ghost">
                            <X className="h-4 w-4 mr-1" />
                            Abbrechen
                          </Button>
                        </DialogClose>
                        <Button onClick={renamePlayer} disabled={!editPlayerName.trim() || isRenaming}>
                          <Check className="h-4 w-4 mr-1" />
                          Speichern
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-amber-600 shrink-0"
                      onClick={() => resetPlayerPassword(player.id, player.name)}
                      disabled={resetLoadingId === player.id}
                      title="Passwort zurücksetzen"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  )}

                  {isAdmin && (
                  <Dialog
                    open={deleteConfirmId === player.id}
                    onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        disabled={!isAdmin}
                        onClick={() => setDeleteConfirmId(player.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Spieler löschen?</DialogTitle>
                      </DialogHeader>
                      <p className="text-muted-foreground">
                        Möchtest du <strong>{player.name}</strong> wirklich löschen?
                        {player.gamesPlayed > 0 && (
                          <span className="block text-destructive mt-2">
                            Dieser Spieler hat bereits {player.gamesPlayed} Spiele gespielt und kann nicht gelöscht werden.
                          </span>
                        )}
                      </p>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="ghost">
                            <X className="h-4 w-4 mr-1" />
                            Abbrechen
                          </Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => deletePlayer(player.id, player.name)}
                          disabled={player.gamesPlayed > 0}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Löschen
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}
                </div>
                  );
                })()
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
