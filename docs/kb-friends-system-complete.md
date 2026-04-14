---
title: Friends System - Complete Implementation
tags: [friends, ui, api, state, autocomplete]
---
# PROBLEM

Implementierung eines Social-Systems mit Freundschaftsanfragen, Status-Management und Benachrichtigungen. Muss Duplikate verhindern und Suchfunktionen unterstützen.

# LÖSUNG

1. **Schema:** Friendship-Model mit `requesterId`, `receiverId`, `status` (pending/accepted) und Unique-Constraint.
2. **API-Endpunkte:** routes für POST (add), GET (list/requests/sent), PATCH (accept), DELETE (reject/remove).
3. **UI Components:** Tabs (Freunde/Eingehend/Ausgehend), Autocomplete mit Debouncing, Badges für Notifications.
4. **Status Logic:** Variable name collision `requestStatus` vs `status` vermeiden (Prisma Property heisst `status`).

# CODE / COMMANDS

```typescript
// API Endpoint Example
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const { username } = await req.json();

  // Find receiver
  const receiver = await db.user.findUnique({ where: { username } });
  if (!receiver || receiver.id === user.userId) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
  }

  // Check duplicate Prisma unique constraint handles this
  try {
    const friendship = await db.friendship.create({
      data: {
        requesterId: user.userId,
        receiverId: receiver.id,
        status: 'pending'
      }
    });
    return NextResponse.json(friendship);
  } catch (e) {
    // Handle P2002 (Unique constraint)
    return NextResponse.json({ error: 'Friendship exists' }, { status: 400 });
  }
}
```

```typescript
// Autocomplete Component Logic (Debounced)
const searchParams = useDebouncedValue(searchTerm, 300);

useEffect(() => {
  if (searchParams.length >= 2) {
     fetch(`/api/users/search?q=${searchParams}`)
      .then(res => res.json())
      .then(setResults)
      .catch(() => setResults([]));
  } else {
    setResults([]);
  }
}, [searchParams]);
```

# SHELL OUTPUT / ERROR

**Common Error:** Property 'status' does not exist on type 'FriendshipRequest'.
**Fix:** The property in the Prisma Schema is named `status`, ensure type definitions match API responses. Do not use `requestStatus` if the field is `status`.

# WEITERE RESOURCES

- UI: `src/components/friends/FriendsTab.tsx`, `UserAutocomplete.tsx`
- API: `src/app/api/friends/route.ts`, `requests/route.ts`
- Schema: `prisma/schema.prisma` (Model Friendship)