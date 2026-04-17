---
title: Prisma Column Does Not Exist Error
tags: [prisma, database, migration, schema, nextjs]
---
# PROBLEM
API-Route gibt HTTP 500 Fehler zurück mit Prisma Error: "The column `main.EloChange.expectedAnteil` does not exist in the current database." Code: P2022. Das passiert nach längerer Laufzeit, obwohl der Code die Spalte erwartet.

# LÖSUNG
1. Prisma Schema prüfen und sicherstellen, dass die Spalte definiert ist
2. Prisma Migration ausführen, um die fehlende Spalte in der Datenbank zu erstellen
3. Prisma Client neu generieren
4. Service neu starten

# CODE / COMMANDS
```bash
# Prisma Schema prüfen
cat prisma/schema.prisma

# Prisma Migration ausführen
npx prisma migrate dev

# Prisma Client neu generieren
npx prisma generate

# Service neu starten
sudo systemctl restart spikeball
```

Wenn die Spalte im Schema fehlt, zum Model hinzufügen:
```prisma
model EloChange {
  // ... andere Felder
  expectedAnteil Float?
}
```

Dann Migration mit Namen:
```bash
npx prisma migrate dev --name add_expected_anteil
```

# SHELL OUTPUT / ERROR
```
Invalid `prisma.player.findUnique()` invocation:
The column `main.EloChange.expectedAnteil` does not exist in the current database.
    at ei.handleRequestError (/home/server2/spikeball/.next/standalone/node_modules/@prisma/client/runtime/library.js:121:7268)
    at ei.handleAndLogRequestError (/home/server2/spikeball/.next/standalone/node_modules/@prisma/client/runtime/library.js:121:6593)
    at ei.request (/home/server2/spikeball/.next/standalone/node_modules/@prisma/client/runtime/library.js:121:6300)
{
  code: 'P2022',
  meta: { modelName: 'Player', column: 'main.EloChange.expectedAnteil' },
  clientVersion: '6.19.2'
}
```

# WEITERE RESOURCEN
- Prisma Schema: prisma/schema.prisma
- Prisma Docs: https://www.prisma.io/docs/reference/api-reference/error-reference#p2022
- API Route: app/api/players/[id]/route.js
---