---
title: Syntax Error - use client Directive
tags: [typescript, syntax, nextjs, directive]
---
# PROBLEM
Die Datei `src/components/profile/AvatarUpload.tsx` hatte einen Syntax-Fehler in der ersten Zeile: "`"use client";`"`, was zu einem Build-Fehler führte.

# LÖSUNG
Die erste Zeile wurde von `""use client";`` zu korrektem `'use client';` korrigiert.

# CODE / COMMANDS
```typescript
// FALSCH:
""use client";

// KORREKT:
'use client';
```

# SHELL OUTPUT / ERROR
```
▲ Next.js 14.2.35
- Environments: .env
Creating an optimized production build ...
Failed to compile.
./src/components/profile/AvatarUpload.tsx
Error: 
x Expected ';', '}' or <eof>
,-[/home/server2/spikeball/src/components/profile/AvatarUpload.tsx:1:1]
1 | ""use client";
  : ^|^^^
  :  `-- This is the expression part of an expression statement
2 | 
3 | import { useState, useRef } from "react";
4 | import { Button } from "@/components/ui/button";
`----

Caused by:
Syntax Error

> Build failed because of webpack errors
```

# WEITERE RESOURCEN
- Datei: `spikeball/src/components/profile/AvatarUpload.tsx`
---