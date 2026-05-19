---
title: Username Duplicate Validation
tags: [api, auth, validation, prisma]
---
# PROBLEM
Benutzer konnten sich mit bereits existierenden Benutzernamen registrieren, was zu Login-Problemen führte. Die Registrierung erlaubte doppelte Benutzernamen ohne Validierung.

# LÖSUNG
Die Validierung wurde bereits in der Registrierungs-API implementiert. Das System prüft an zwei Stellen auf Duplikate:
1. In der `user` Tabelle (für Login-Credentials)
2. In der `player` Tabelle (für Spielernamen)

# CODE / COMMANDS
Die Validierung ist in `src/app/api/auth/register/route.ts` implementiert:

```typescript
// Check if username already exists
const existingUser = await db.user.findUnique({
  where: { username },
});

if (existingUser) {
  return NextResponse.json(
    { error: 'Benutzername existiert bereits' },
    { status: 409 }
  );
}

// Check if player name already exists
const existingPlayer = await db.player.findUnique({
  where: { name: username },
});

if (existingPlayer) {
  return NextResponse.json(
    { error: 'Name existiert bereits' },
    { status: 409 }
  );
}
```

# SHELL OUTPUT / ERROR
Wenn ein doppelter Benutzername versucht wird zu registrieren:
- HTTP Status: 409 Conflict
- Response: `{ "error": "Benutzername existiert bereits" }` oder `{ "error": "Name existiert bereits" }`

# WEITERE RESOURCEN
- File: `src/app/api/auth/register/route.ts`
- Prisma Docs: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
---