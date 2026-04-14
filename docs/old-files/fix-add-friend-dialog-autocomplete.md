---
title: Add Friend Dialog Autocomplete Integration
tags: [friends, react, fix, autocomplete, user-search]
---
# PROBLEM
Der "Freund hinzufügen" Dialog zeigte nur ein einfaches Input-Feld ohne Suchfunktion. User konnten nicht nach anderen Benutzern suchen, sondern mussten exakte Usernamen kennen. Zudem war die UX verwirrend, da eine `UserAutocomplete`-Komponente existierte aber nicht verwendet wurde.

# LÖSUNG
1. Importiere die `UserAutocomplete`-Komponente und entferne das einfache `Input`-Feld
2. Implementiere `handleUserSelect` Funktion, um userId und username aus der Auswahl zu setzen
3. Aktualisiere den Submit-Text zu "Freundschaft anfragen" für mehr Klarheit
4. Initialisiere `userId` und `username` State und leere sie beim Schließen des Dialogs
5. Aktualisiere die DialogDescription auf "Suche einen Benutzer über seinen Namen oder Spielernamen"

# CODE / COMMANDS
```typescript
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

interface AddFriendDialogProps {
  onSuccess?: () => void;
}

export function AddFriendDialog({ onSuccess }: AddFriendDialogProps) {
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
```

# SHELL OUTPUT / ERROR
Keine Errors. Die Integration war erfolgreich.

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/components/friends/AddFriendDialog.tsx`
- UserAutocomplete-Komponente: `spikeball/src/components/friends/UserAutocomplete.tsx`
---