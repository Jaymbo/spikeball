import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RotateCcw, AlertCircle, MessageSquare, Settings, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureRequestsAdmin } from "./FeatureRequestsAdmin";
import { AdminPlayers } from "./AdminPlayers";

interface AdminToolsProps {
  onRefresh?: () => void;
  players?: any[];
}

export default function AdminTools({ onRefresh, players = [] }: AdminToolsProps) {
  const [replayLoading, setReplayLoading] = useState(false);
  const [showReplayConfirm, setShowReplayConfirm] = useState(false);

  const handleReplayGames = async () => {
    setReplayLoading(true);
    try {
      const res = await fetch("/api/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(`Fehler: ${error.error || "Unbekannter Fehler"}`);
        return;
      }

      const data = await res.json();
      toast.success(data.message);
      setShowReplayConfirm(false);
      onRefresh?.();
    } catch (err) {
      console.error("Error replaying games:", err);
      toast.error("Fehler beim Neuladen der Spiele");
    } finally {
      setReplayLoading(false);
    }
  };

  return (
    <>
      <Tabs defaultValue="tools" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tools" className="gap-2">
            <Settings className="h-4 w-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="players" className="gap-2">
            <Users className="h-4 w-4" />
            Spieler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Administrative Tools</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verwende diese Funktionen, um die ELO-Bewertungen basierend auf dem Spielverlauf
                  neu zu berechnen.
                </p>
                <Button
                  onClick={() => setShowReplayConfirm(true)}
                  disabled={replayLoading}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {replayLoading ? "Wird neu berechnet..." : "Spiele neu berechnen"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <FeatureRequestsAdmin />
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <AdminPlayers players={players} onPlayersChange={onRefresh} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showReplayConfirm} onOpenChange={setShowReplayConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wirklich alle Spiele neu berechnen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dies wird:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Alle Spieler auf 1000 ELO zurücksetzen</li>
                <li>Alle Statistiken (Spiele, Siege, Niederlagen) zurücksetzen</li>
                <li>Alle Spiele chronologisch durchgehen und neu berechnen</li>
              </ul>
              <p className="mt-4 font-semibold text-foreground">
                Diese Aktion kann nicht rückgängig gemacht werden!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReplayGames}
              disabled={replayLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {replayLoading ? "Wird berechnet..." : "Neu berechnen"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
