---
title: Fix Spikeball Build Error Unterminated String
tags: [nextjs, typescript, build, syntax-error]
---
# PROBLEM
Next.js Build fehlgeschlagen mit Syntax Error: "Unterminated string constant" in `src/app/api/leaderboard/route.ts`

# LÖSUNG
1. Datei `src/app/api/leaderboard/route.ts` öffnen
2. Die führenden und schließenden Anführungszeichen (`"` am Start und `"` am Ende) entfernen
3. Die Datei sollte regulärer TypeScript-Code ohne JSON-like String-Wrapping sein

# CODE / COMMANDS
```bash
npm run build
```
Datei korrigieren (vorher - falsch):
```typescript
"import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
...
}" # schließend

Nachher - richtig:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
...
} # ohne führende/schließende Anführungszeichen

# SHELL OUTPUT / ERROR
```
Failed to compile.
./src/app/api/leaderboard/route.ts
Error: 
x Unterminated string constant
,-[/home/server2/spikeball/src/app/api/leaderboard/route.ts:1:1]
1 | "import { NextResponse } from 'next/server';
: ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

# WEITERE RESOURCEN
- Datei: `spikeball/src/app/api/leaderboard/route.ts`
---