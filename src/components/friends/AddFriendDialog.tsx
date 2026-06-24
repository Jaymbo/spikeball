"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAutocomplete } from "./UserAutocomplete";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useInvalidateFriends } from "@/hooks/use-friends";

interface AddFriendDialogProps {
  onSuccess?: () => void;
}

export function AddFriendDialog({ onSuccess }: AddFriendDialogProps) {
  const invalidateFriends = useInvalidateFriends();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (res.ok) {
        toast.success("Freundschaftsanfrage gesendet!");
        setUsername("");
        setUserId("");
        setOpen(false);
        invalidateFriends();
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Senden der Anfrage");
      }
    } catch (_error) {
      toast.error("Fehler beim Senden der Anfrage");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (selectedUserId: string, selectedUsername: string) => {
    setUserId(selectedUserId);
    setUsername(selectedUsername);
  };

  const handleAutocompleteBlur = () => {
    // Allow form submission with the selected or typed username
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Freund hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Freund hinzufügen</DialogTitle>
          <DialogDescription>
            Suche einen Benutzer über seinen Namen oder Spielernamen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <UserAutocomplete 
            onSelect={handleUserSelect}
            onBlur={handleAutocompleteBlur}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setUsername("");
                setUserId("");
              }}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !username.trim()}>
              {loading ? "Wird gesendet..." : "Freundschaft anfragen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}