import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Trash2, Edit, KeyRound, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Player {
  id: string;
  name: string;
  eloRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  lastPlayedAt: string | null;
}

interface AdminPlayersProps {
  players: Player[];
  onPlayersChange?: () => void;
}

export function AdminPlayers({ players, onPlayersChange }: AdminPlayersProps) {
  const notifyChange = () => onPlayersChange?.();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [newName, setNewName] = useState("");
  const [resetPasswordPlayer, setResetPasswordPlayer] = useState<Player | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (playerId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/players?id=${playerId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        // Prüfen ob Spieler Spiele hat (Fehlercode 409)
        if (res.status === 409) {
          toast.error(error.error || "Spieler hat gespielte Spiele und kann nicht gelöscht werden");
        } else {
          toast.error(`Fehler: ${error.error || "Unbekannter Fehler"}`);
        }
        return;
      }

      toast.success("Spieler erfolgreich gelöscht");
      setDeleteConfirm(null);
      notifyChange();
    } catch (_error) {
      toast.error("Fehler beim Löschen des Spielers");
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!editPlayer || !newName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editPlayer.id,
          name: newName.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(`Fehler: ${error.error || "Unbekannter Fehler"}`);
        return;
      }

      toast.success("Spielername erfolgreich geändert");
      setEditPlayer(null);
      setNewName("");
      notifyChange();
    } catch (_error) {
      toast.error("Fehler beim Ändern des Spielernamens");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordPlayer || !newPassword.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetPasswordPlayer.id,
          resetPassword: newPassword.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(`Fehler: ${error.error || "Unbekannter Fehler"}`);
        return;
      }

      toast.success("Passwort erfolgreich zurückgesetzt");
      setResetPasswordPlayer(null);
      setNewPassword("");
    } catch (_error) {
      toast.error("Fehler beim Zurücksetzen des Passworts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Spieler-Verwaltung</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Verwalte alle Spieler: Namen ändern, Passwörter zurücksetzen oder Spieler löschen.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{player.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ELO: {player.eloRating.toFixed(1)} • Spiele: {player.gamesPlayed}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditPlayer(player);
                    setNewName(player.name);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setResetPasswordPlayer(player);
                    setNewPassword("");
                  }}
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteConfirm(player.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spieler wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 mt-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Achtung!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dies wird den Spieler und alle zugehörigen Daten dauerhaft löschen.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Diese Aktion kann nicht rückgängig gemacht werden!
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Hinweis:</strong> Spieler können nur gelöscht werden, wenn sie keine Spiele gespielt haben. 
                    Falls der Spieler Spiele hat, musst du zuerst diese Spiele löschen.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={!!editPlayer} onOpenChange={() => setEditPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spielername ändern</DialogTitle>
            <DialogDescription>
              Ändere den Namen von {editPlayer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newName">Neuer Name</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Neuer Spielername"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditPlayer(null)}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleRename}
                disabled={loading || !newName.trim()}
              >
                {loading ? "Wird geändert..." : "Ändern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordPlayer} onOpenChange={() => setResetPasswordPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
            <DialogDescription>
              Setze ein neues Passwort für {resetPasswordPlayer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Neues Passwort"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Das Passwort muss mindestens 6 Zeichen lang sein.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setResetPasswordPlayer(null)}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={loading || !newPassword.trim() || newPassword.length < 6}
              >
                {loading ? "Wird zurückgesetzt..." : "Zurücksetzen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}