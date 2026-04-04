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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AddFriendDialogProps {
  onSuccess?: () => void;
}

export function AddFriendDialog({ onSuccess }: AddFriendDialogProps) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
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
        setOpen(false);
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Fehler beim Senden der Anfrage");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Fehler beim Senden der Anfrage");
    } finally {
      setLoading(false);
    }
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
            Gib den Benutzernamen ein, um eine Freundschaftsanfrage zu senden.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Benutzername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !username.trim()}>
              {loading ? "Wird gesendet..." : "Senden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}