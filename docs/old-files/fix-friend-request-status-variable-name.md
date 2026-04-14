---
title: Friend Request Status Variable Name Mismatch
tags: [typescript, api, friendships, variable-naming, fix]
---
# PROBLEM
TypeScript-Fehler im API-Endpunkt `/api/players/[id]/route.ts`: Die Variable `friendRequestStatus` wurde verwendet (Zeile 221), aber im Scope existierte nur `friendRequestType` (Zeile 157). Das führte zu einem TypeScript Compliler Error (Code 18004: "No value exists in scope").

# LÖSUNG
1. Die Variable `friendRequestStatus` wurde in Zeile 221 zu `friendRequestType` korrigiert, um mit der definierten Variable übereinzustimmen
2. Variable konsistent benennen und verwenden, um CAM (Compile And More) Fehler zu vermeiden

# CODE / COMMANDS
```typescript
// FALSCH (vorher):
return NextResponse.json({
  ...,
  isFriend,
  friendRequestStatus, // TypeScript Error: Variable not found
});

// RICHTIG (nachher):
return NextResponse.json({
  ...,
  isFriend,
  friendRequestType, // Variable korrekt referenziert
});
```

# SHELL OUTPUT / ERROR
```
TypeScript Error: No value exists in scope for the shorthand property 'friendRequestStatus'. Either declare one or provide an initializer.
Source: ts (extHost2)
Severity: 8
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/src/app/api/players/[id]/route.ts`
- Zeile 221: Die korrigierte Referenz auf `friendRequestType`
- Zeile 157: Die Deklaration der Variable
---