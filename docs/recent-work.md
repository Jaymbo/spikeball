**Zeit:** 2025-01-18 (neu)
**Thema:** Friendship Status Display Fix & Accept Handler Missing
**Aktion:** 
1. Debug-Logs zur Friendship-Status-Prüfung in API und Frontend hinzugefügt
2. Fehlenden POST-Handler für `/api/friends/requests` (Annehmen/Ablehnen von Anfragen) implementiert
**Ergebnis:** 
- Friendship Button im Profil zeigt jetzt korrekt den Status (Angefragt/Eingehend/Befreundet)
- "Annehmen" von Freundschaftsanfragen funktioniert jetzt
- Debug-Logs in Console: `[API Friendship Check]`, `[API] Returning friendship status`, `[PlayerProfile rendering] State values`

---

**Zeitstempel:** 2025-01-17
**Thema:** Prisma Foreign Key Constraint Fix
**Aktion:** DELETE Route `/api/players` korrigiert - Löschreihenfolge geändert
**Ergebnis:** Player wird jetzt erfolgreich gelöscht. Die korrekte Löschreihenfolge ist:
1. EloChange
2. Friendship (durch User verknüpft)
3. FeatureRequest (durch User verknüpft)
4. User (Parent)
5. Player (Child)

Vorheriger Fehler: `FOREIGN KEY constraint failed (Code 1811)` weil Player zuerst gelöscht wurde, obwohl Player.userId auf User.id verweist.

---
