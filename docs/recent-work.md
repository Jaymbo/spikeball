---
**Zeit:** 2025-01-18
**Thema:** Polling Performance Optimization - React Query Implementation
**Aktion:** Replaced inefficient polling with React Query for intelligent data fetching. Created custom hooks (useAuth, usePlayers, usePendingFriendRequests) with caching, staleTime, and refetchInterval strategies. Implemented optimistic updates for friend requests.
**Ergebnis:**
- Created: `src/lib/query-client.tsx` - QueryClient Provider with optimized defaults
- Created: `src/hooks/use-auth.ts` - Auth hook with 5min refetch interval (was: constant polling)
- Created: `src/hooks/use-players.ts` - Players hook with 2min staleTime, 5min refetch
- Created: `src/hooks/use-friends.ts` - Friends hook with optimistic updates, 60s refetch (was: 30s)
- Updated: `src/app/page.tsx` - Removed all manual polling, using React Query hooks
- Updated: `src/app/layout.tsx` - Added QueryClientProvider wrapper
- Updated: `src/components/FeatureRequestChatWidget.tsx` - Using useAuth hook
- Updated: `src/components/friends/FriendRequests.tsx` - Using optimistic updates
- Updated: `src/app/page-auth.tsx` - Using useAuth hook

Performance improvements:
- Auth checks: Every 5min instead of constant polling
- Friend requests: Every 60s instead of 30s
- Players: Every 5min instead of on every refreshTrigger
- Optimistic UI updates for friend requests (instant feedback)
- Intelligent caching reduces unnecessary API calls

---
**Zeit:** 2025-01-18 (neu)
**Thema:** Git Divergent Branches - Rebase Solution
**Aktion:**
1. Lokale Änderungen nach `git stash apply` committen
2. `git pull --rebase` statt merge ausgeführt
3. `git push` erfolgreich durchgeführt
**Ergebnis:**
- Divergent branches Problem gelöst
- Änderungen erfolgreich in Remote integriert
- Befehle: `git add -A && git commit -m "Apply stash changes" && git pull --rebase && git push`

---
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
