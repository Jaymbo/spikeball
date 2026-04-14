---
title: Prisma Schema Syntax Error Fix
tags: [prisma, schema, syntax-error, database-models]
---

# PROBLEM
Das Prisma-Schema enthält einen Syntax-Fehler im datasource Block, der dazu führt, dass die Datenbank-Generierung fehlschlägt: `datasource db {i` statt korrekter Syntax `datasource db {`.

# LÖSUNG
1. Entferne das überflüssige `i` im datasource Block
2. Syntax muss exakt `datasource db {` lauten
3. Nach der Korrektur `npx prisma generate` und `npx prisma db push` ausführen

# CODE / COMMANDS
```prisma
// ❌ FALSCH (Zeile 7 in schema.prisma)
datasource db {i    
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ✅ KORREKT
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

```bash
# Nach Korrektur ausführen
npx prisma generate
npx prisma db push
```

# SHELL OUTPUT / ERROR
```
Error: Schema parsing error: Expected '{', got 'i'
Error: Could not generate Prisma Client
```

# WEITERE RESOURCEN
- Dateipfad: `spikeball/prisma/schema.prisma`
- Prisma Schema Docs: <https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference>
---