---
title: Friendship UI Complete Implementation
tags: [friendship, ui-complete, handlers, button-logic, implementation]
---

# PROBLEM
Das Freundschafts-System hatte incomplete UI:
1. Status-Badges wurden angezeigt, aber Buttons reagierte nicht auf alle Status-Werte
2. Nur "Freund hinzufügen" wurde angezeigt, selbst wenn bereits eine Anfrage gesendet oder empfangen wurde
3. Die Handler-Funktionen für Annehmen, Ablehnen, Abbrechen und Entfernen fehlten komplett

# LÖSUNG
1. **4 Handler-Funktionen implementiert** (in PlayerProfile.tsx):
   - `handleAcceptFriendRequest()`: Akzeptiert eingehende Anfrage via POST /api/friends/requests
   - `handleRejectFriendRequest()`: Lehnt ab via DELETE /api/friends/[id]
   - `handleCancelFriendRequest()`: Bricht ausgehende Anfrage ab via DELETE
   - `handleRemoveFriend()`: Entfernt befreundeten User via DELETE
   
2. **Button-Rendering komplett umgebaut**:
   - Nutzt IIFE (Immediately Invoked Function Expression)
   - Reagiert auf 4Status-Werte:
     * `null`: Zeigt "Freund hinzufgen" Button
     * `"outgoing"`: Zeigt "Anfrage zurckziehen" Button
     * `"incoming"`: Zeigt "Annehmen" + "Ablehnen" Buttons (zwei Buttons nebeneinander)
     * `"accepted"` oder `isFriend`: Zeigt "Freund entfernen" Button

3. **State-Management korrigiert**: Alle Handler rufen `await fetchPlayerData()` auf, um den aktuellen Status vom Server abzurufen

# CODE / COMMANDS

Neue Handler-Funktionen (hinzugefgt nach handleSendFriendRequest):
```typescript
const handleAcceptFriendRequest = async () => {
  setFriendRequestLoading(true);
  try {
    const friendshipsRes = await fetch("/api/friends");
    if (friendshipsRes.ok) {
      const friendships = await friendshipsRes.json();
      const incomingRequest = friendships.find((f: any) => 
        f.receiverId === currentUserId && f.requesterId === playerId
      );
      
      if (incomingRequest) {
        const acceptRes = await fetch("/api/friends/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            friendshipId: incomingRequest.id, 
            action: "accept" 
          }),
        });

        if (acceptRes.ok) {
          toast.success("Freundschaft angenommen!");
          setFriendRequestType("accepted");
          setIsFriend(true);
          await fetchPlayerData();
        }
      }
    }
  } catch (err) {
    console.error("Error accepting friend request:", err);
    toast.error("Fehler beim Annehmen der Anfrage");
  } finally {
    setFriendRequestLoading(false);
  }
};

const handleRejectFriendRequest = async () => {
  setFriendRequestLoading(true);
  try {
    const friendshipsRes = await fetch("/api/friends");
    if (friendshipsRes.ok) {
      const friendships = await friendshipsRes.json();
      const incomingRequest = friendships.find((f: any) => 
        f.receiverId === currentUserId && f.requesterId === playerId
      );
      
      if (incomingRequest) {
        const rejectRes = await fetch(`/api/friends/${incomingRequest.id}`, {
          method: "DELETE",
        });

        if (rejectRes.ok) {
          toast.success("Anfrage abgelehnt");
          setFriendRequestType(null);
          await fetchPlayerData();
        }
      }
    }
  } catch (err) {
    console.error("Error rejecting friend request:", err);
    toast.error("Fehler beim Ablehnen der Anfrage");
  } finally {
    setFriendRequestLoading(false);
  }
};

const handleCancelFriendRequest = async () => {
  setFriendRequestLoading(true);
  try {
    const friendshipsRes = await fetch("/api/friends");
    if (friendshipsRes.ok) {
      const friendships = await friendshipsRes.json();
      const outgoingRequest = friendships.find((f: any) => 
        f.requesterId === currentUserId && f.receiverId === playerId
      );
      
      if (outgoingRequest) {
        const cancelRes = await fetch(`/api/friends/${outgoingRequest.id}`, {
          method: "DELETE",
        });

        if (cancelRes.ok) {
          toast.success("Anfrage zurückgezogen");
          setFriendRequestType(null);
          await fetchPlayerData();
        }
      }
    }
  } catch (err) {
    console.error("Error canceling friend request:", err);
    toast.error("Fehler beim Zurückziehen der Anfrage");
  } finally {
    setFriendRequestLoading(false);
  }
};

const handleRemoveFriend = async () => {
  setFriendRequestLoading(true);
  try {
    const friendshipsRes = await fetch("/api/friends");
    if (friendshipsRes.ok) {
      const friendships = await friendshipsRes.json();
      const friendship = friendships.find((f: any) => 
        (f.requesterId === currentUserId && f.receiverId === playerId) ||
        (f.requesterId === playerId && f.receiverId === currentUserId)
      );
      
      if (friendship) {
        const removeRes = await fetch(`/api/friends/${friendship.id}`, {
          method: "DELETE",
        });

        if (removeRes.ok) {
          toast.success("Freund entfernt");
          setFriendRequestType(null);
          setIsFriend(false);
          await fetchPlayerData();
        }
      }
    }
  } catch (err) {
    console.error("Error removing friend:", err);
    toast.error("Fehler beim Entfernen");
  } finally {
    setFriendRequestLoading(false);
  }
};
```

Komplettes Button-Rendering:
```typescript
{showFriendButton && (
  (() => {
    if (isFriend || friendRequestType === "accepted") {
      return (
        <Button
          onClick={handleRemoveFriend}
          disabled={friendRequestLoading}
          size="sm"
          variant="outline"
          className="gap-2 w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <UserMinus className="h-4 w-4" />
          {friendRequestLoading ? "Wird entfernt..." : "Freund entfernen"}
        </Button>
      );
    }
    if (friendRequestType === "incoming") {
      return (
        <div className="flex gap-2">
          <Button
            onClick={handleAcceptFriendRequest}
            disabled={friendRequestLoading}
            size="sm"
            variant="default"
            className="gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Annehmen
          </Button>
          <Button
            onClick={handleRejectFriendRequest}
            disabled={friendRequestLoading}
            size="sm"
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
            Ablehnen
          </Button>
        </div>
      );
    }
    if (friendRequestType === "outgoing") {
      return (
        <Button
          onClick={handleCancelFriendRequest}
          disabled={friendRequestLoading}
          size="sm"
          variant="outline"
          className="gap-2 w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
          {friendRequestLoading ? "Wird abgebrochen..." : "Anfrage zurückziehen"}
        </Button>
      );
    }
    return (
      <Button
        onClick={handleSendFriendRequest}
        disabled={friendRequestLoading}
        size="sm"
        variant="default"
        className="gap-2 w-full sm:w-auto"
      >
        <UserPlus className="h-4 w-4" />
        {friendRequestLoading ? "Wird gesendet..." : "Freund hinzufgen"}
      </Button>
    );
  })()
)}
```

# SHELL OUTPUT / ERROR
Keine Errors. Implementierung erfolgreich.

# WEITERE RESOURCESC
- Dateipfad: `spikeball/src/components/profile/PlayerProfile.tsx`
- Vorheriger Fixes: `docs/fix-friend-request-status-variable-name.md`
- Vorheriger Fixes: `docs/fix-friendship-status-display-complete.md`
- Vorheriger Fixes: `docs/fix-add-friend-dialog-autocomplete.md`
